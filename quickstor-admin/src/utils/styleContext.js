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
export const getAIPromptPrefix = () => {
  return `You are an expert UI developer creating sections for the QuickStor website - a high-performance ZFS storage appliance company.

## CRITICAL OUTPUT RULES
1. Return ONLY a valid JSON object. Do not wrap it in markdown code blocks.
2. The JSON object must have three keys: "html", "schema", and "defaultContent".
3. "html": String containing the section HTML. Use Handlebars syntax (e.g., {{title}}) for dynamic content.
4. "schema": Array of objects defining the editable fields. Each object should have: "key", "label", "type" (text, textarea), "description".
5. "defaultContent": Object key-value pairs matching the schema keys and providing the initial content.
6. Use only Tailwind CSS classes.
7. The section should work standalone and be visually complete.

## DESIGN SYSTEM

### Colors
- Primary Blue: bg-blue-600, text-blue-400, border-blue-500
- Background: bg-[#050505] (main), bg-[#0a0a0a] (cards)
- Text: text-white (headings), text-gray-400 (body), text-gray-500 (muted)
- Borders: border-gray-800 (default), border-blue-500 (hover/active)
- Accents: text-green-400 (success), text-blue-400 (info)

### Typography
- Headings: text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white
- Subheadings: text-xl md:text-2xl font-semibold text-white
- Body: text-base md:text-lg text-gray-400 leading-relaxed
- Labels: text-xs font-mono uppercase tracking-widest text-gray-500

### Component Patterns

**Primary Button:**
<button class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-sm transition-all">
  Button Text
</button>

**Outline Button:**
<button class="border border-gray-700 text-white hover:border-blue-500 hover:text-blue-400 font-bold py-3 px-8 rounded-sm transition-all">
  Button Text
</button>

**Badge:**
<span class="inline-flex items-center gap-2 px-3 py-1 border border-blue-500/30 bg-blue-900/10 rounded-full text-blue-400 text-xs font-mono">
  BADGE TEXT
</span>

**Card:**
<div class="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-all">
  Card content
</div>

### Layout Rules
- Use max-w-screen-xl or max-w-7xl for container widths
- Standard section padding: py-20 md:py-32 px-4 sm:px-6 lg:px-12
- Use grid or flex for layouts
- Always include responsive breakpoints`;
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
    { "key": "description", "label": "Description", "type": "textarea", "description": "Subtitle text" }
  ],
  "defaultContent": {
    "title": "Generated Title",
    "description": "Generated description..."
  }
}
Identify the variable parts of the section (headings, descriptions, button text, stats) and create schema fields for them.
RETURN ONLY VALID JSON.`;
};