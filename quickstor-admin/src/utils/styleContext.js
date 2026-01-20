/**
 * QuickStor Design System & Style Context
 * Used to provide consistent branding to AI-generated UI components
 */

export const styleContext = {
  colors: {
    primary: 'blue-600',
    primaryHover: 'blue-500',
    secondary: 'gray-900',
    accent: 'green-500',
    text: {
      primary: 'white',
      secondary: 'gray-400',
      heading: 'white',
      muted: 'gray-500'
    },
    background: {
      main: '#050505',
      card: '#0a0a0a',
      cardHover: '#111111',
      input: 'white'
    },
    border: {
      default: 'gray-800',
      hover: 'blue-500'
    }
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    headings: 'font-bold tracking-tight',
    body: 'text-sm leading-relaxed'
  },
  components: {
    button: {
      primary: 'bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-sm transition-all',
      outline: 'border border-gray-700 text-white hover:border-blue-500 hover:text-blue-400 font-bold py-3 px-6 rounded-sm transition-all',
      ghost: 'text-gray-400 hover:text-white transition-all'
    },
    card: 'bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-all group',
    badge: 'inline-flex items-center gap-2 px-3 py-1 border border-blue-500/30 bg-blue-900/10 rounded-full text-blue-400 text-xs font-mono tracking-widest',
    input: 'w-full rounded-md border border-gray-700 bg-[#0a0a0a] px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  },
  rules: [
    "Always use Tailwind CSS classes.",
    "Do not use arbitrary values (e.g. w-[350px]) unless absolutely necessary.",
    "Use semantic HTML5 elements (section, article, header, etc.).",
    "Ensure all text has sufficient contrast against dark backgrounds.",
    "Use responsive classes (sm:, md:, lg:) for mobile-first design.",
    "Add hover states to interactive elements.",
    "Use consistent spacing with Tailwind's spacing scale."
  ]
};

/**
 * Generate comprehensive prompt prefix for AI UI generation
 * This provides the full design system context to Gemini
 */
import { promptService } from './promptService';

/**
 * Generate comprehensive prompt prefix for AI UI generation
 * This provides the full design system context to Gemini
 */
export const getAIPromptPrefix = () => {
  // Try local customization first
  const custom = localStorage.getItem('quickstor_system_prompt_custom');
  if (custom) return custom;

  // Fallback to service default
  return promptService.get('system.default');
};

/**
 * Generate section-specific prompt
 */
export const getSectionGenerationPrompt = (userPrompt) => {
  return `${getAIPromptPrefix()}

## USER REQUEST
Create a website section based on this description:
"${userPrompt}"

## OUTPUT SCHEMA
Return a JSON object with this structure:
{
  "html": "<section class='...'> <h2>{{title}}</h2> <p>{{description}}</p> </section>",
  "schema": [
    { "key": "title", "label": "Section Title", "type": "text", "description": "Main heading" },
    { "key": "description", "label": "Description", "type": "textarea", "description": "Subtitle text" },
    { "key": "bgImage", "label": "Background Image", "type": "image", "description": "Section background" }
  ],
  "defaultContent": {
    "title": "Generated Title",
    "description": "Generated description..."
  }
}
Identify the variable parts of the section (headings, descriptions, button text, stats) and create schema fields for them.
RETURN ONLY VALID JSON.`;
};