/**
 * AI Service Factory
 * Manages switching between Gemini and OpenAI/Compatible providers
 */

import { callGeminiAPI, callGeminiAPIStream, callGeminiAPIWithHistoryStream, callGeminiAPIWithHistory } from './geminiClient';

const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1';

// --- Token Estimation & Context Management ---

/**
 * Estimate token count from text (~4 characters per token for English)
 */
export function estimateTokenCount(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

/**
 * Get context limit for the current provider/model
 * DeepSeek models have 131,072 token context
 */
export function getContextLimit(config) {
    if (config?.provider === 'openai') {
        const model = config.openai?.model?.toLowerCase() || '';
        // DeepSeek models
        if (model.includes('deepseek')) {
            return 131072;
        }
        // GPT-4 Turbo / GPT-4o
        if (model.includes('gpt-4')) {
            return 128000;
        }
        // GPT-3.5
        if (model.includes('gpt-3.5')) {
            return 16385;
        }
        // Default for unknown OpenAI-compatible
        return 32000;
    }
    // Gemini has 1M+ context, effectively unlimited for our use
    return 1000000;
}

/**
 * Summarize a document to fit within target token count
 * Uses chunked summarization to handle documents larger than the context window
 * @param {string} text - The document text to summarize
 * @param {number} targetTokens - Target token count for the summary
 * @param {object} config - AI configuration
 * @param {function} onProgress - Optional callback for progress updates
 */
export async function summarizeDocumentForContext(text, targetTokens, config, onProgress = null) {
    const currentTokens = estimateTokenCount(text);

    // Helper to report progress
    const report = (msg) => {
        console.log(msg);
        if (onProgress) onProgress(msg);
    };

    // If already within limit, return as-is
    if (currentTokens <= targetTokens) {
        console.log(`Document already fits: ${currentTokens} <= ${targetTokens} tokens`);
        return text;
    }

    report(`Analyzing document (~${Math.round(currentTokens / 1000)}K tokens)...`);

    const contextLimit = getContextLimit(config);

    // Use only 25% of context for the chunk to leave room for prompt + response
    const maxChunkTokens = Math.floor(contextLimit * 0.25);
    const maxChunkChars = maxChunkTokens * 4;

    // If the document is small enough to summarize in one call, do it directly
    if (currentTokens < maxChunkTokens) {
        report('Summarizing document...');
        return await summarizeSingleChunk(text, targetTokens, config);
    }

    // CHUNKED SUMMARIZATION: Split document into chunks that fit in context
    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
        const chunk = remaining.substring(0, maxChunkChars);
        chunks.push(chunk);
        remaining = remaining.substring(maxChunkChars);
    }

    report(`Splitting into ${chunks.length} chunks for processing...`);

    // Each chunk summary should be aggressively compressed
    const tokensPerChunkSummary = Math.min(
        Math.floor(maxChunkTokens / 10),
        Math.floor(targetTokens / chunks.length)
    );

    // Summarize each chunk sequentially
    const chunkSummaries = [];

    for (let i = 0; i < chunks.length; i++) {
        report(`Summarizing chunk ${i + 1} of ${chunks.length}...`);
        const summary = await summarizeSingleChunk(chunks[i], tokensPerChunkSummary, config);
        chunkSummaries.push(summary);
    }

    // Combine all chunk summaries
    const combinedSummary = chunkSummaries.join('\n\n');
    const combinedTokens = estimateTokenCount(combinedSummary);

    console.log(`Combined summaries: ~${combinedTokens} tokens (target: ${targetTokens})`);

    // If combined is still too large, recursively summarize again
    if (combinedTokens > targetTokens) {
        report('Running additional compression pass...');
        return await summarizeDocumentForContext(combinedSummary, targetTokens, config, onProgress);
    }

    report('Document summarization complete!');
    return combinedSummary;
}

/**
 * Summarize a single chunk of text (must fit within context window)
 */
async function summarizeSingleChunk(text, targetTokens, config) {
    const targetChars = targetTokens * 4;

    const summarizePrompt = `You are a document summarizer. Condense the following text while preserving key information.

TARGET: ~${targetChars} characters (about ${targetTokens} tokens).

RULES:
1. Preserve specific facts, figures, statistics, and data points
2. Keep important names, dates, and technical terms
3. Use concise language but don't lose critical information
4. Output ONLY the summary, no explanations

TEXT TO SUMMARIZE:
${text}

SUMMARY:`;

    try {
        const { apiKey, baseUrl = OPENAI_DEFAULT_URL, model = 'gpt-4o' } = config.openai;
        const url = `${baseUrl}/chat/completions`;

        const response = await callOpenAIProxy(url, apiKey, {
            model: model,
            messages: [{ role: 'user', content: summarizePrompt }],
            temperature: 0.3,
            max_tokens: Math.min(targetTokens + 500, 8000)
        });

        const data = await response.json();

        // Check for API errors
        if (data.error) {
            throw new Error(data.error.message || 'API Error');
        }

        const summary = data.choices?.[0]?.message?.content || '';
        return summary;
    } catch (error) {
        console.error('Chunk summarization failed:', error);
        // Fallback: truncate this chunk
        console.warn('Falling back to truncation for this chunk...');
        return text.substring(0, targetChars);
    }
}

// --- OpenAI Implementation ---

// --- OpenAI Proxy Helper ---
async function callOpenAIProxy(url, apiKey, body) {
    try {
        const response = await fetch('/api/proxy/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, apiKey, body })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Proxy Error: ${response.status}`);
        }
        return response;
    } catch (e) {
        console.error('Proxy Request Failed:', e);
        throw e;
    }
}

async function callOpenAI(prompt, config) {
    const { apiKey, baseUrl = OPENAI_DEFAULT_URL, model = 'gpt-4o' } = config;
    const url = `${baseUrl}/chat/completions`;

    try {
        const response = await callOpenAIProxy(url, apiKey, {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (error) {
        console.error('OpenAI Call Failed:', error);
        throw error;
    }
}

async function callOpenAIStream(prompt, onChunk, config) {
    const { apiKey, baseUrl = OPENAI_DEFAULT_URL, model = 'gpt-4o' } = config;
    const url = `${baseUrl}/chat/completions`;

    try {
        const response = await fetch('/api/proxy/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                apiKey,
                body: {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    stream: true
                }
            })
        });

        if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const content = data.choices[0]?.delta?.content || '';
                        if (content) {
                            fullText += content;
                            onChunk(content, fullText);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }
        return fullText;
    } catch (error) {
        console.error('OpenAI Stream Failed:', error);
        throw error;
    }
}

async function callOpenAIWithHistoryStream(messages, onChunk, config) {
    const { apiKey, baseUrl = OPENAI_DEFAULT_URL, model = 'gpt-4o' } = config;
    const url = `${baseUrl}/chat/completions`;

    // Map 'model' role to 'assistant' for OpenAI
    const openAIMessages = messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.text || m.content // Handle both text formats
    }));

    try {
        // Use proxy to avoid CORS
        const response = await fetch('/api/proxy/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                apiKey,
                body: {
                    model: model,
                    messages: openAIMessages,
                    temperature: 0.7,
                    stream: true
                }
            })
        });

        if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const content = data.choices[0]?.delta?.content || '';
                        if (content) {
                            fullText += content;
                            onChunk(content, fullText);
                        }
                    } catch (e) { }
                }
            }
        }
        return fullText;
    } catch (error) {
        console.error('OpenAI History Stream Failed:', error);
        throw error;
    }
}


// --- Main Service Export ---

export const getAIConfig = () => {
    return JSON.parse(localStorage.getItem('quickstor_ai_config') || JSON.stringify({
        provider: 'gemini', // 'gemini' | 'openai'
        openai: {
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o'
        }
        // Gemini uses env var by default, but could extend here
    }));
};

export const getProviderInfo = () => {
    const config = getAIConfig();
    if (config.provider === 'openai') {
        return { name: 'OpenAI / Compatible', model: config.openai.model, icon: 'Bot' };
    }
    return { name: 'Google Gemini', model: 'Gemini Pro', icon: 'Sparkles' };
};

export const saveAIConfig = (config) => {
    localStorage.setItem('quickstor_ai_config', JSON.stringify(config));
};

export const AIService = {
    generateContent: async (promptOrObj) => {
        const config = getAIConfig();
        const prompt = typeof promptOrObj === 'string' ? promptOrObj : promptOrObj.text;
        const attachments = (typeof promptOrObj === 'object' && promptOrObj.attachments) ? promptOrObj.attachments : [];

        if (config.provider === 'openai') {
            // TODO: Add attachment support for OpenAI if needed
            // For now, if text file, append to prompt
            let finalPrompt = prompt;
            if (attachments.length > 0) {
                attachments.forEach(att => {
                    if (att.text) {
                        finalPrompt += `\n\n[Attached Context: ${att.name}]\n${att.text}`;
                    }
                });
            }
            return callOpenAI(finalPrompt, config.openai);
        }

        // Gemini
        if (attachments.length > 0) {
            const parts = [{ text: prompt }];
            attachments.forEach(file => {
                // If it has base64 (Image), use inlineData
                if (file.base64) {
                    const base64Data = file.base64.split(',')[1];
                    parts.push({
                        inlineData: {
                            mimeType: file.type,
                            data: base64Data
                        }
                    });
                }
                // If it has text content (Text File), append as text part
                else if (file.text) {
                    parts.push({
                        text: `\n\n[Attached Context: ${file.name}]\n${file.text}`
                    });
                }
            });
            return callGeminiAPI(parts);
        }

        return callGeminiAPI(prompt);
    },

    streamContent: async (promptOrObj, onChunk) => {
        const config = getAIConfig();
        const prompt = typeof promptOrObj === 'string' ? promptOrObj : promptOrObj.text;
        const attachments = (typeof promptOrObj === 'object' && promptOrObj.attachments) ? promptOrObj.attachments : [];

        if (config.provider === 'openai') {
            // TODO: Implement OpenAI single-turn with attachments if needed
            return callOpenAIStream(prompt, onChunk, config.openai);
        }

        // Gemini
        if (attachments.length > 0) {
            const parts = [{ text: prompt }];
            attachments.forEach(file => {
                const base64Data = file.base64.split(',')[1];
                parts.push({
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data
                    }
                });
            });
            return callGeminiAPIStream(parts, onChunk);
        }

        return callGeminiAPIStream(prompt, onChunk);
    },

    streamChat: async (messages, onChunk) => {
        const config = getAIConfig();
        const isOpenAI = config.provider === 'openai';

        // Pre-process messages to format attachments for the provider
        const formattedMessages = messages.map(msg => {
            // Keep existing simple text messages
            if (msg.text && !msg.attachments?.length) {
                return msg;
            }

            // Handle messages with attachments
            if (msg.attachments?.length > 0) {
                if (isOpenAI) {
                    // OpenAI Format
                    const content = [{ type: 'text', text: msg.text || '' }];
                    msg.attachments.forEach(file => {
                        if (file.type.startsWith('image/')) {
                            content.push({
                                type: 'image_url',
                                image_url: { url: file.base64 }
                            });
                        }
                    });
                    return { role: msg.role, content }; // OpenAI uses 'content' array
                } else {
                    // Gemini Format
                    const parts = [{ text: msg.text || '' }];
                    msg.attachments.forEach(file => {
                        // Extract base64 
                        const base64Data = file.base64.split(',')[1];
                        parts.push({
                            inlineData: {
                                mimeType: file.type,
                                data: base64Data
                            }
                        });
                    });
                    return { role: msg.role, parts };
                }
            }

            // Fallback
            return msg;
        });

        if (isOpenAI) {
            return callOpenAIWithHistoryStream(formattedMessages, onChunk, config.openai);
        }
        return callGeminiAPIWithHistoryStream(formattedMessages, onChunk);
    }
};
