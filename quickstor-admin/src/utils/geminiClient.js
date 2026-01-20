
/**
 * Gemini AI Client
 * Handles direct API calls to Google's Gemini
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call Gemini API with a prompt and get a text response
 * Non-streaming fallback
 */
export async function callGeminiAPI(promptOrParts) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }

    // Support both simple string prompt and complex parts array
    const parts = typeof promptOrParts === 'string'
        ? [{ text: promptOrParts }]
        : promptOrParts;

    let lastError;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.2,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 4096,
                    }
                })
            });

            if (response.status === 429 || response.status === 503) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
                console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await sleep(delay);
                continue;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('No response generated from Gemini API');
            }

            return text;
        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES - 1 && error.message?.includes('429')) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
                await sleep(delay);
                continue;
            }
        }
    }

    throw lastError || new Error('Failed after multiple retries');
}

/**
 * Call Gemini API with a prompt and stream the response
 */
export async function callGeminiAPIStream(promptOrParts, onChunk) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured.');
    }

    const STREAM_URL = GEMINI_API_URL.replace('generateContent', 'streamGenerateContent');
    const parts = typeof promptOrParts === 'string'
        ? [{ text: promptOrParts }]
        : promptOrParts;

    let fullText = '';

    try {
        const response = await fetch(`${STREAM_URL}?key=${GEMINI_API_KEY}&alt=sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.substring(6); // Remove 'data: '
                        const data = JSON.parse(jsonStr);
                        const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;

                        if (textChunk) {
                            fullText += textChunk;
                            if (onChunk) onChunk(textChunk, fullText);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }

        if (!fullText) {
            throw new Error('No response generated from Gemini API');
        }

        return fullText;

    } catch (error) {
        console.error('Streaming error:', error);
        // Fallback to non-streaming if needed, but usually we just throw
        throw error;
    }
}

/**
 * Call Gemini API with conversation history for multi-turn chat (Streaming)
 */
export async function callGeminiAPIWithHistoryStream(messages, onChunk) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured.');
    }

    const STREAM_URL = GEMINI_API_URL.replace('generateContent', 'streamGenerateContent');

    // Updated to support attachments in history
    const contents = messages.map(msg => ({
        role: msg.role,
        parts: msg.parts || [{ text: msg.text }]
    }));

    let fullText = '';

    try {
        const response = await fetch(`${STREAM_URL}?key=${GEMINI_API_KEY}&alt=sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.substring(6);
                        const data = JSON.parse(jsonStr);
                        const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;

                        if (textChunk) {
                            fullText += textChunk;
                            if (onChunk) onChunk(textChunk, fullText);
                        }
                    } catch (e) {
                        // Ignore
                    }
                }
            }
        }

        return fullText;
    } catch (error) {
        console.error('Streaming error:', error);
        return callGeminiAPIWithHistory(messages);
    }
}

export async function callGeminiAPIWithHistory(messages) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }

    // Updated to support attachments in history
    const contents = messages.map(msg => ({
        role: msg.role,
        parts: msg.parts || [{ text: msg.text }]
    }));

    let lastError;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 4096,
                    }
                })
            });

            if (response.status === 429 || response.status === 503) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
                await sleep(delay);
                continue;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('No response generated from Gemini API');
            }

            return text;
        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES - 1 && error.message?.includes('429')) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
                await sleep(delay);
                continue;
            }
        }
    }

    throw lastError || new Error('Failed after multiple retries');
}
