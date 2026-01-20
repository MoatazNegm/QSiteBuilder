/**
 * Content Generation Service (formerly Gemini AI Service)
 * Handles high-level content generation logic using the configured AI provider
 */

import { AIService } from './aiService';

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
        const prompt = getPrompt(sectionOrType, fileContent);
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
 */
export async function generateSectionContent(sectionType, userPrompt, currentContent = {}) {
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
            schemaDescription = `
            A JSON object with keys matching the section's content fields.
            Common fields might include title, subtitle, image_url, etc.
            `;
            exampleJSON = `{ "title": "Custom Section", "description": "Generated content" }`;
            break;
        default:
            throw new Error(`Unsupported section type for AI generation: ${sectionType}`);
    }

    const systemPrompt = `
    You are a professional UX copywriter and web designer.
    Generate JSON content for a website section of type: ${sectionType}.
    
    The user wants content about: "${userPrompt}"
    
    Strictly follow this JSON structure:
    ${schemaDescription}
    
    Return ONLY raw JSON. No markdown formatting. No backticks.
    Example format:
    ${exampleJSON}
    `;

    try {
        const response = await AIService.generateContent(systemPrompt);
        return extractJSONFromResponse(response);
    } catch (error) {
        console.error('AI Generation Failed:', error);
        throw new Error('Failed to generate content. Please try a different prompt.');
    }
}
