/**
 * Content Generation Service (formerly Gemini AI Service)
 * Handles high-level content generation logic using the configured AI provider
 */

import { AIService, estimateTokenCount, getContextLimit, summarizeDocumentForContext, getAIConfig } from './aiService';
import { promptService } from './promptService';

// Re-export extraction utilities so imports don't break
// (These are pure functions, no dependencies)
export function extractJSONFromResponse(text) {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1].trim());
    }

    const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
    }

    throw new Error('Could not extract valid JSON from AI response');
}

export function parseCSVFallback(csvText, sectionType) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        throw new Error('File must contain a header row and at least one data row.');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
    const dataRows = lines.slice(1);

    const parsedData = dataRows.map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i];
        });
        return obj;
    });

    if (sectionType === 'COMPARISON_GRAPH') {
        return parsedData.map(row => ({
            name: row.name || 'Unknown',
            iops: parseInt(row.iops) || 0,
            throughput: parseInt(row.throughput) || 0
        }));
    } else if (sectionType === 'FEATURE_GRID') {
        return parsedData.map(row => ({
            icon: row.icon || 'Star',
            title: row.title || 'Untitled Feature',
            description: row.description || ''
        }));
    }

    throw new Error('Unsupported section type for CSV fallback');
}

/**
 * Main function to extract data from file content using AI
 */
export async function extractDataWithAI(fileContent, sectionOrType, getPrompt) {
    const sectionType = typeof sectionOrType === 'object' ? sectionOrType.type : sectionOrType;

    try {
        let prompt = getPrompt(sectionOrType, fileContent);

        // Inject System Prompt for consistency
        const baseSystemPrompt = promptService.getSystemPrompt();
        prompt = `${baseSystemPrompt}\n\n${prompt}`;

        // Use AIService instead of direct Gemini call
        const response = await AIService.generateContent(prompt);
        const extractedData = extractJSONFromResponse(response);
        return { data: extractedData, method: 'ai' };
    } catch (aiError) {
        console.warn('AI extraction failed, trying CSV fallback:', aiError.message);

        // Try CSV fallback
        try {
            const csvData = parseCSVFallback(fileContent, sectionType);
            return { data: csvData, method: 'csv' };
        } catch (csvError) {
            throw new Error(
                `AI extraction failed: ${aiError.message}\n\n` +
                `CSV fallback also failed: ${csvError.message}\n\n` +
                `Tip: For CSV format, use headers: name,iops,throughput (for graphs) or icon,title,description (for features)`
            );
        }
    }
}

/**
 * Generate content for a specific section based on user prompt
 * @param {string} sectionType - The type of section to generate
 * @param {string} userPrompt - User's content request
 * @param {object} currentContent - Current section content/schema
 * @param {object} attachment - Optional file attachment
 * @param {function} onProgress - Optional callback for progress updates
 */
export async function generateSectionContent(sectionType, userPrompt, currentContent = {}, attachment = null, onProgress = null) {
    let schemaDescription = '';
    let exampleJSON = '';

    // Define schemas based on section type
    switch (sectionType) {
        case 'HERO':
            schemaDescription = `
            - badge: Short text for a badge (e.g., "New Feature")
            - title: { line1: "Main headline", highlight: "Highlighted word" }
            - subtitle: Descriptive text (1-2 sentences)
            - primaryCta: Text for primary button
            - secondaryCta: Text for secondary button
            `;
            exampleJSON = `{
                "badge": "2.0 Release",
                "title": { "line1": "Future of", "highlight": "Storage" },
                "subtitle": "Experience lightning fast data transfer.",
                "primaryCta": "Get Started",
                "secondaryCta": "Learn More"
            }`;
            break;
        case 'FEATURE_GRID':
            schemaDescription = `
            - features: Array of objects, each with:
              - icon: Icon name (one of: Star, Shield, Zap, Cloud, Server, Database, Lock, Globe, Smartphone, Laptop)
              - title: Short feature title
              - description: Feature description
            `;
            exampleJSON = `{
                "features": [
                    { "icon": "Zap", "title": "Fast", "description": "Super fast speed." },
                    { "icon": "Shield", "title": "Secure", "description": "Bank-grade security." }
                ]
            }`;
            break;
        case 'COMPARISON_GRAPH':
            schemaDescription = `
            - title: Graph section title
            - description: Detailed explanation of the comparison
            - data: Array of objects with:
              - name: Product/Competitor name
              - iops: Number (integer)
              - throughput: Number (integer)
            `;
            exampleJSON = `{
                "title": "Performance Comparison",
                "description": "See how we stack up.",
                "data": [
                    { "name": "Us", "iops": 50000, "throughput": 1200 },
                    { "name": "Them", "iops": 10000, "throughput": 500 }
                ]
            }`;
            break;
        case 'CUSTOM_HTML':
            // Dynamically build schema from the section's actual schema
            if (currentContent.schema && currentContent.schema.length > 0) {
                const fieldDescriptions = currentContent.schema.map(field => {
                    let typeHint = 'text';
                    if (field.type === 'image') typeHint = 'image URL';
                    else if (field.type === 'textarea') typeHint = 'longer text (paragraph)';
                    else if (field.type === 'url') typeHint = 'URL';
                    return `- ${field.key}: ${field.label} (${typeHint})`;
                }).join('\n            ');

                schemaDescription = `
            A JSON object with these exact keys:
            ${fieldDescriptions}
            `;

                // Build example JSON from actual schema
                const exampleObj = {};
                currentContent.schema.forEach(field => {
                    if (field.type === 'image') {
                        exampleObj[field.key] = 'https://example.com/image.jpg';
                    } else if (field.type === 'textarea') {
                        exampleObj[field.key] = 'A detailed description or paragraph of content.';
                    } else {
                        exampleObj[field.key] = `${field.label} content`;
                    }
                });
                exampleJSON = JSON.stringify(exampleObj, null, 4);
            } else {
                schemaDescription = `
            A JSON object with keys matching the section's content fields.
            Common fields might include title, subtitle, image_url, etc.
            `;
                exampleJSON = `{ "title": "Custom Section", "description": "Generated content" }`;
            }
            break;
        default:
            throw new Error(`Unsupported section type for AI generation: ${sectionType}`);
    }

    const baseSystemPrompt = promptService.getContentFillingPrompt();

    // Check provider and handle attachments accordingly
    const config = getAIConfig();
    const isGemini = config.provider === 'gemini';

    // Determine if we can use the attachment
    let effectiveAttachment = null;
    if (attachment) {
        const isImageAttachment = attachment.type?.startsWith('image/');

        if (isImageAttachment && !isGemini) {
            // OpenAI-compatible providers (like DeepSeek) don't support image inputs
            console.warn('Image attachments are only supported with Gemini. Skipping image for OpenAI-compatible provider.');
            // Don't throw - just proceed without the image
            // User can still use text attachments
        } else {
            effectiveAttachment = attachment;
        }
    }

    // For OpenAI-compatible providers, check if text attachment exceeds context limit
    if (effectiveAttachment && effectiveAttachment.text && !isGemini) {
        const contextLimit = getContextLimit(config);

        // Be VERY conservative with available space
        // The full prompt (schema, examples, formatting) can be 2000+ tokens
        // Plus we need response room of 4000+ tokens
        // Use only 40% of context for the document to be safe
        const safeDocumentLimit = Math.floor(contextLimit * 0.4); // ~52K for DeepSeek

        const documentTokens = estimateTokenCount(effectiveAttachment.text);

        console.log(`=== Context Limit Check ===`);
        console.log(`Provider Context Limit: ${contextLimit} tokens`);
        console.log(`Safe Document Limit (40%): ~${safeDocumentLimit} tokens`);
        console.log(`Document Tokens: ~${documentTokens}`);

        if (documentTokens > safeDocumentLimit) {
            if (onProgress) onProgress('Document too large, summarizing...');

            // Summarize the document to fit within context
            const summarizedText = await summarizeDocumentForContext(
                effectiveAttachment.text,
                safeDocumentLimit,
                config,
                onProgress  // Pass the progress callback
            );

            // Update attachment with summarized content
            effectiveAttachment = {
                ...effectiveAttachment,
                text: summarizedText,
                name: `${effectiveAttachment.name} (Summarized)`
            };

            console.log(`Document summarized successfully.`);
        } else {
            console.log(`Document fits within context limit.`);
        }
        console.log(`===========================`);
    }

    const fullPrompt = `
    ${baseSystemPrompt}
    
    TASK: Generate JSON content for a website section of type: ${sectionType}.
    
    The user wants content about: "${userPrompt}"
    ${effectiveAttachment ? `(Refer to the attached ${effectiveAttachment.type.startsWith('image/') ? 'image' : 'file'} for context)` : ''}
    
    IMPORTANT: You MUST include ALL fields listed below. Do not skip any field.
    
    Required JSON structure (include EVERY field):
    ${schemaDescription}
    
    RULES:
    1. Return ONLY raw JSON - no markdown, no backticks, no explanations
    2. Include ALL fields listed above - every single one
    3. Generate creative, relevant content for each field based on the user's request
    
    Example format:
    ${exampleJSON}
    `;

    // Debug: Log the full prompt and token estimate
    const promptCharCount = fullPrompt.length;
    const estimatedTokens = Math.ceil(promptCharCount / 4); // ~4 chars per token estimate

    console.log('=== AI Content Generation Debug ===');
    console.log('Full Prompt:\n', fullPrompt);
    console.log('---');
    console.log(`Prompt Length: ${promptCharCount} characters`);
    console.log(`Estimated Tokens (prompt only): ~${estimatedTokens}`);

    if (effectiveAttachment) {
        const attachmentSize = effectiveAttachment.base64?.length || effectiveAttachment.text?.length || 0;
        const attachmentTokens = Math.ceil(attachmentSize / 4);
        console.log(`Attachment Size: ${attachmentSize} characters`);
        console.log(`Estimated Attachment Tokens: ~${attachmentTokens}`);
        console.log(`TOTAL Estimated Tokens: ~${estimatedTokens + attachmentTokens}`);
    }
    console.log('===================================');

    try {
        if (onProgress) onProgress('Generating content...');

        const payload = effectiveAttachment
            ? { text: fullPrompt, attachments: [effectiveAttachment] }
            : fullPrompt;

        const response = await AIService.generateContent(payload);
        return extractJSONFromResponse(response);
    } catch (error) {
        console.error('AI Generation Failed:', error);
        throw new Error('Failed to generate content. Please try a different prompt.');
    }
}
