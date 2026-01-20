/**
 * Section-Specific Extraction Prompts for Gemini AI
 * Each prompt is optimized to extract the exact data structure needed for that section type
 */

import { promptService } from './promptService';

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
    const schemaFields = schema.map(field => `"${field.key}": "extracted value"`).join(',\n  ');

    let template = promptService.get('extraction.custom_html');
    if (!template) return "Error: Prompt not loaded";

    return template
      .replace('{{schemaFields}}', schemaFields)
      .replace('{{schemaDescription}}', schemaDescription)
      .replace('{{fileContent}}', fileContent.substring(0, 8000));
  }

  // Map section types to prompt keys
  const keyMap = {
    'COMPARISON_GRAPH': 'extraction.comparison_graph',
    'FEATURE_GRID': 'extraction.feature_grid',
    'HERO': 'extraction.hero'
  };

  const promptKey = keyMap[sectionType] || 'extraction.feature_grid';
  let template = promptService.get(promptKey);

  if (!template) {
    // Fallback or error if prompts aren't loaded yet (though init should have run)
    return `Generate JSON for ${sectionType} from content: ${fileContent.substring(0, 1000)}...`;
  }

  // Replace common placeholders
  let prompt = template.replace('{{fileContent}}', fileContent);

  // Specific replacements
  if (sectionType === 'FEATURE_GRID') {
    prompt = prompt.replace('{{availableIcons}}', AVAILABLE_ICONS.join(', '));
  }

  return prompt;
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
