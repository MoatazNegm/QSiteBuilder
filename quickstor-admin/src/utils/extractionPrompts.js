/**
 * Section-Specific Extraction Prompts for Gemini AI
 * Each prompt is optimized to extract the exact data structure needed for that section type
 */

const AVAILABLE_ICONS = [
  'Shield', 'ShieldCheck', 'Lock', 'Key', 'Zap', 'Cpu', 'Server', 'Database',
  'HardDrive', 'Activity', 'BarChart', 'LineChart', 'TrendingUp', 'Gauge',
  'Clock', 'Timer', 'RefreshCw', 'RotateCcw', 'Cloud', 'CloudOff', 'Download',
  'Upload', 'Wifi', 'Signal', 'Globe', 'Network', 'Share2', 'GitBranch',
  'Layers', 'Box', 'Package', 'Archive', 'Folder', 'File', 'FileText',
  'Settings', 'Sliders', 'Tool', 'Wrench', 'Cog', 'CheckCircle', 'Check',
  'AlertCircle', 'AlertTriangle', 'Info', 'HelpCircle', 'Star', 'Heart',
  'ThumbsUp', 'Award', 'Trophy', 'Target', 'Crosshair', 'Eye', 'EyeOff',
  'Search', 'Maximize', 'Minimize', 'Move', 'ArrowRight', 'ArrowUp', 'Rocket'
];

/**
 * Get the extraction prompt for a given section type
 * @param {string|Object} sectionOrType - The section type string or section object
 * @param {string} fileContent - The raw file content to extract from
 * @returns {string} - The complete prompt to send to Gemini
 */
export function getExtractionPrompt(sectionOrType, fileContent) {
  const sectionType = typeof sectionOrType === 'object' ? sectionOrType.type : sectionOrType;

  if (sectionType === 'CUSTOM_HTML') {
    const schema = sectionOrType.content?.schema || [];
    const schemaDescription = schema.map(field =>
      `- "${field.key}": ${field.description} (Type: ${field.type})`
    ).join('\n');

    return `You are a data extraction assistant. Extract content from the document to populate a website section.

OUTPUT SCHEMA (JSON Only):
{
  ${schema.map(field => `"${field.key}": "extracted value"`).join(',\n  ')}
}

FIELD DETAILS:
${schemaDescription}

EXTRACTION RULES:
- Extract the most relevant information for each field from the document.
- If a field cannot be found, use an empty string or a reasonable default based on context.
- Keep text concise and suitable for a website section.
- Return ONLY the JSON object, no explanation.

DOCUMENT CONTENT:
"""
${fileContent.substring(0, 8000)}
"""

JSON OUTPUT:`;
  }

  const prompts = {
    COMPARISON_GRAPH: `You are a data extraction assistant. Extract performance benchmark data from the following document.

The data should be formatted as a JSON array where each item represents a competitor or product with their performance metrics.

OUTPUT SCHEMA (strict):
[
  {
    "name": "string (product/competitor name)",
    "iops": number (I/O operations per second, extract as integer),
    "throughput": number (throughput in MB/s, extract as integer)
  }
]

EXTRACTION RULES:
- Look for any mention of IOPS, I/O operations, read/write speeds
- Look for throughput, bandwidth, MB/s, GB/s values (convert GB/s to MB/s by multiplying by 1000)
- If a metric is missing, estimate it reasonably or use 0
- Clean up product names to be concise (e.g., "QuickStor Z-Series" not "The QuickStor Z-Series storage solution")
- Order results with the best performer LAST (for chart visual impact)
- Return ONLY the JSON array, no explanation

DOCUMENT CONTENT:
"""
${fileContent}
"""

JSON OUTPUT:`,

    FEATURE_GRID: `You are a data extraction assistant. Extract feature/benefit information from the following document to create feature cards.

OUTPUT SCHEMA (strict):
[
  {
    "icon": "string (lucide-react icon name)",
    "title": "string (short, punchy feature title, max 4 words)",
    "description": "string (1-2 sentence description of the feature)"
  }
]

AVAILABLE ICONS (choose from these only):
${AVAILABLE_ICONS.join(', ')}

EXTRACTION RULES:
- Create 3-6 feature cards from the content
- Choose icons that semantically match the feature (e.g., "Shield" for security, "Zap" for speed)
- Titles should be concise and impactful (e.g., "Self-Healing Data", "Blazing Fast")
- Descriptions should be benefit-focused, not just feature descriptions
- If content is sparse, infer reasonable features from context
- Return ONLY the JSON array, no explanation

DOCUMENT CONTENT:
"""
${fileContent}
"""

JSON OUTPUT:`,

    HERO: `You are a data extraction assistant. Extract landing page hero section content from the following document.

OUTPUT SCHEMA (strict):
{
  "badge": "string (short badge text like 'NEW', 'V2.0', 'ENTERPRISE READY', max 3 words)",
  "title": {
    "line1": "string (first line of headline, typically 3-5 words)",
    "highlight": "string (emphasized part of headline, 2-4 impactful words)"
  },
  "subtitle": "string (1-2 sentence supporting description)",
  "primaryCta": "string (main call-to-action button text, 2-3 words, action-oriented)",
  "secondaryCta": "string (secondary button text, 2-3 words)"
}

EXTRACTION RULES:
- Badge should be uppercase, punchy, indicate newness or value
- Title line1 + highlight should form a complete impactful headline
- Make the highlight the most important/exciting part
- Subtitle should explain the value proposition
- CTAs should be action verbs (e.g., "GET STARTED", "VIEW DEMO", "LEARN MORE")
- If content is marketing copy, extract the key messages
- If content is technical, create marketing-friendly versions
- Return ONLY the JSON object, no explanation

DOCUMENT CONTENT:
"""
${fileContent}
"""

JSON OUTPUT:`
  };

  return prompts[sectionType] || prompts.FEATURE_GRID; // Default to feature grid
}

/**
 * Validate extracted data against expected schema
 * @param {any} data - The extracted data
 * @param {string} sectionType - The section type
 * @returns {boolean} - Whether the data is valid
 */
export function validateExtractedData(data, sectionType) {
  if (!data) return false;

  if (sectionType === 'CUSTOM_HTML') {
    // Basic validation: should be an object
    return typeof data === 'object' && !Array.isArray(data);
  }

  try {
    switch (sectionType) {
      case 'COMPARISON_GRAPH':
        return Array.isArray(data) && data.every(item =>
          typeof item.name === 'string' &&
          typeof item.iops === 'number' &&
          typeof item.throughput === 'number'
        );

      case 'FEATURE_GRID':
        return Array.isArray(data) && data.every(item =>
          typeof item.icon === 'string' &&
          typeof item.title === 'string' &&
          typeof item.description === 'string'
        );

      case 'HERO':
        return typeof data === 'object' &&
          typeof data.badge === 'string' &&
          typeof data.title === 'object' &&
          typeof data.title.line1 === 'string' &&
          typeof data.title.highlight === 'string' &&
          typeof data.subtitle === 'string';

      default:
        return false;
    }
  } catch {
    return false;
  }
}
