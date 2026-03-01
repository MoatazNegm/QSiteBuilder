
const CACHE_KEY = 'quickstor_prompts';

/**
 * Service to manage system prompts, loading them from external JSON
 * and ensuring they are available to the application.
 */
class PromptService {
    constructor() {
        this.prompts = null;
        this.initializationPromise = null;
        this.customSystemPrompt = null;
        this.customFillingPrompt = null;
    }

    /**
     * Initialize the service by fetching global settings and defaults
     */
    async init() {
        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = (async () => {
            try {
                // 1. Fetch user customizations from Backend
                try {
                    const settingsRes = await fetch('/api/data/settings/global');
                    if (settingsRes.ok) {
                        const settings = await settingsRes.json();
                        if (settings) {
                            this.customSystemPrompt = settings.systemPrompt || null;
                            this.customFillingPrompt = settings.fillingPrompt || null;
                            if (settings.prompts) {
                                this.prompts = settings.prompts;
                                console.log('Prompts loaded from backend settings');
                            }
                        }
                    }
                } catch (apiErr) {
                    console.warn('Failed to fetch custom prompts from backend, proceeding with defaults', apiErr);
                }

                // 2. Fetch from public/prompts.json if not in settings
                if (!this.prompts) {
                    console.log('Fetching default prompts from /prompts.json...');
                    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
                    const response = await fetch(`${baseUrl}prompts.json`);
                    if (!response.ok) throw new Error('Failed to fetch default prompts');
                    this.prompts = await response.json();
                }

            } catch (error) {
                console.error('CRITICAL: Failed to initialize prompts!', error);
                // Fallback to empty prompts - user MUST configure them
                this.prompts = { system: { default: "" } };
            }
        })();

        return this.initializationPromise;
    }

    /**
     * Get a specific prompt by path (e.g., 'theme.generation')
     */
    get(path) {
        if (!this.prompts) return "";

        return path.split('.').reduce((obj, key) => obj?.[key], this.prompts) || "";
    }

    /**
     * Get the active system prompt (Custom or Default)
     */
    getContentFillingPrompt() {
        // Try custom first (User defined in memory)
        if (this.customFillingPrompt) return this.customFillingPrompt;

        // Fallback: Default Agent Persona
        return `You are an expert Content Architect and Web Copywriter Agent.
Your goal is to help the user perfectly fill in the content fields for their website sections.
You are creative, concise, and technically precise with JSON structure.
You understand modern web design trends and write engaging, conversion-focused copy.
When a user provides a file or image, analyze it deeply to extract relevant themes, tone, and details to generate the best possible content match.`;
    }

    /**
     * Get the general system prompt (Legacy / General)
     */
    getSystemPrompt() {
        // Try custom first
        if (this.customSystemPrompt) return this.customSystemPrompt;

        // Fallback to default in prompts.json
        return this.get('system.default') || "You are a professional UX copywriter and web designer.";
    }

    /**
     * Get the Smart Theme Application Prompt
     */
    getSmartThemePrompt() {
        return `You are an AI-powered Color Theme Specialist. Your task is to COMPLETELY RESTYLE a website section's JSON to match a new color theme.

CRITICAL RULES:
1. You MUST change EVERY color-related field to use theme colors. Do NOT leave any original colors.
2. Look for ANY field containing: color, Color, bg, background, Background, fill, stroke, border, text, font, gradient, shadow, accent, highlight, tint, shade, hue.
3. Even if a field name doesn't match exactly (e.g., "cardBg", "btnHover", "linkStyle"), YOU MUST identify it as a color field and update it.
4. For HEX values like "#FFFFFF" or "#000", ALWAYS replace with the appropriate theme color.
5. For gradient strings, update all color stops to use theme colors.
6. For font families, use the theme's font if provided.

COLOR MAPPING STRATEGY:
- Primary Color: Use for main CTAs, important buttons, accent elements, links, highlights
- Secondary Color: Use for secondary buttons, badges, tags, less prominent accents
- Background Color: Use for section backgrounds, page backgrounds, large containers
- Surface Color: Use for cards, panels, input fields, elevated containers
- Text Color: Use for headings, titles, main body text
- Text Muted Color: Use for subtitles, descriptions, placeholders, secondary text
- Border Color: Use for dividers, outlines, separators, card borders

EXAMPLES OF FIELDS TO UPDATE (not exhaustive):
- titleColor, subtitleColor, textColor, descriptionColor
- backgroundColor, bgColor, cardBg, sectionBg, containerBg
- buttonColor, buttonBg, btnColor, ctaColor, linkColor
- borderColor, outlineColor, dividerColor
- iconColor, badgeColor, tagColor, accentColor
- hoverColor, activeColor, focusColor
- gradientStart, gradientEnd, gradientColors
- shadowColor, glowColor, overlayColor
- headerBg, footerBg, navbarBg, sidebarBg
- fontFamily, headingFont, bodyFont

RESPONSE FORMAT:
Return ONLY the complete updated JSON object. Do not include any explanation or markdown. Just pure JSON.`;
    }

    /**
     * Reload prompts from source (Reset to defaults)
     */
    async resetToDefaults() {
        this.prompts = null;
        this.customSystemPrompt = null;
        this.customFillingPrompt = null;
        this.initializationPromise = null;
        await this.init();
        return this.prompts;
    }

    // Setters for memory cache updates from Settings
    setCustomSystemPrompt(prompt) {
        this.customSystemPrompt = prompt;
    }

    setCustomFillingPrompt(prompt) {
        this.customFillingPrompt = prompt;
    }
}

export const promptService = new PromptService();
