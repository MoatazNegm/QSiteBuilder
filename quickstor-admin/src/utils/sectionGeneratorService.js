/**
 * Section Generator Service
 * Generates and iteratively edits HTML sections using Gemini AI
 */

import { AIService } from './aiService';
import { getSectionGenerationPrompt, getAIPromptPrefix } from './styleContext';

/**
 * Generate a section HTML from a user prompt (initial generation)
 * @param {string} userPrompt - The user's description of what they want
 * @param {function(string, string): void} onProgress - Callback(chunk, fullText)
 * @returns {Promise<{html: string, schema: Array, defaultContent: Object, error: string|null}>}
 */
export async function generateSectionHTML(userPrompt, onProgress, attachments = []) {
    try {
        const promptText = getSectionGenerationPrompt(userPrompt);
        // Pass object with text and attachments
        const response = await AIService.streamContent({
            text: promptText,
            attachments
        }, onProgress);

        // Clean up the response
        let text = response.trim();
        // Remove markdown blocks if present
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            // Fallback try to find JSON object if mixed with text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('AI did not return valid JSON. Please try rephrasing your prompt.');
            }
        }

        if (!result.html) {
            throw new Error('AI response missing HTML content.');
        }

        return {
            html: result.html,
            schema: result.schema || [],
            defaultContent: result.defaultContent || {},
            error: null
        };
    } catch (error) {
        console.error('Section generation error:', error);
        return {
            html: null,
            schema: [],
            defaultContent: {},
            error: error.message || 'Failed to generate section. Please try again.'
        };
    }
}

/**
 * Edit an existing section based on chat history
 * @param {Array} chatHistory - Array of {role: 'user'|'model', content: string}
 * @param {string} currentHTML - The current HTML of the section
 * @param {string} editRequest - The user's edit request
 * @param {function(string, string): void} onProgress - Callback(chunk, fullText)
 * @returns {Promise<{html: string, schema: Array, defaultContent: Object, error: string|null}>}
 */
export async function editSectionWithChat(chatHistory, currentHTML, editRequest, onProgress, attachments = []) {
    try {
        // Build the conversation for Gemini
        const systemContext = `${getAIPromptPrefix()}

## CURRENT STATE
The user has the following section:
\`\`\`html
${currentHTML}
\`\`\`

## CONVERSATION CONTEXT
You are helping the user iteratively improve this section.
Respond with a JSON object containing the COMPLETE updated "html", "schema", and "defaultContent".
- If the request is a small change, modify only the relevant parts
- Always return a full standard response object
- Maintain the Handlebars syntax for dynamic fields
- Update schema if new fields are added`;

        // Build messages array for multi-turn conversation
        const messages = [
            { role: 'user', text: systemContext }
        ];

        // Add chat history
        chatHistory.forEach(msg => {
            messages.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                text: msg.content,
                attachments: msg.attachments // Pass history attachments
            });
        });

        // Add the new edit request
        messages.push({
            role: 'user',
            text: `Edit request: ${editRequest}\n\nRespond with the complete JSON object only:`,
            attachments: attachments // Pass new attachments
        });

        const response = await AIService.streamChat(messages, onProgress);

        // Clean up response
        let text = response.trim();
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('AI did not return valid JSON.');
            }
        }

        return {
            html: result.html,
            schema: result.schema || [],
            defaultContent: result.defaultContent || {},
            error: null
        };
    } catch (error) {
        console.error('Section edit error:', error);
        return {
            html: null,
            schema: [],
            defaultContent: {},
            error: error.message || 'Failed to edit section. Please try again.'
        };
    }
}

/**
 * Save a generated section to local storage library
 */
export function saveToLibrary(section) {
    const library = JSON.parse(localStorage.getItem('quickstor_custom_sections') || '[]');

    const newSection = {
        id: `custom-${Date.now()}`,
        name: section.name || 'Custom Section',
        type: 'CUSTOM_HTML',
        html: section.html,
        schema: section.schema || [],
        defaultContent: section.defaultContent || {},
        prompt: section.prompt,
        createdAt: new Date().toISOString()
    };

    library.push(newSection);
    localStorage.setItem('quickstor_custom_sections', JSON.stringify(library));

    return newSection;
}

/**
 * Get all custom sections from library
 */
export function getCustomSections() {
    return JSON.parse(localStorage.getItem('quickstor_custom_sections') || '[]');
}

/**
 * Delete a custom section from library
 */
export function deleteFromLibrary(sectionId) {
    const library = getCustomSections();
    const filtered = library.filter(s => s.id !== sectionId);
    localStorage.setItem('quickstor_custom_sections', JSON.stringify(filtered));
}
