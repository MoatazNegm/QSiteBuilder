/**
 * AI Service Factory
 * Manages switching between Gemini and OpenAI/Compatible providers
 */

import { callGeminiAPI, callGeminiAPIStream, callGeminiAPIWithHistoryStream, callGeminiAPIWithHistory } from './geminiClient';

const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1';

// --- OpenAI Implementation ---

async function callOpenAI(prompt, config) {
    const { apiKey, baseUrl = OPENAI_DEFAULT_URL, model = 'gpt-4o' } = config;

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (error) {
        console.error('OpenAI Call Failed:', error);
        throw error;
    }
}

async function callOpenAIStream(prompt, onChunk, config) {
    const { apiKey, baseUrl = OPENAI_DEFAULT_URL, model = 'gpt-4o' } = config;

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                stream: true
            })
        });

        if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

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

    // Map 'model' role to 'assistant' for OpenAI
    const openAIMessages = messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.text || m.content // Handle both text formats
    }));

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: openAIMessages,
                temperature: 0.7,
                stream: true
            })
        });

        if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

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
    generateContent: async (prompt) => {
        const config = getAIConfig();
        if (config.provider === 'openai') {
            return callOpenAI(prompt, config.openai);
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
