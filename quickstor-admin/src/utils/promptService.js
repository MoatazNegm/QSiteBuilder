
const CACHE_KEY = 'quickstor_prompts';

/**
 * Service to manage system prompts, loading them from external JSON
 * and ensuring they are available to the application.
 */
class PromptService {
    constructor() {
        this.prompts = null;
        this.initializationPromise = null;
    }

    /**
     * Initialize the service by loading prompts from localStorage or fetching from public/prompts.json
     */
    async init() {
        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = (async () => {
            try {
                // 1. Try to load from LocalStorage first (User customizations)
                const stored = localStorage.getItem(CACHE_KEY);
                if (stored) {
                    try {
                        this.prompts = JSON.parse(stored);
                        console.log('Prompts loaded from localStorage');
                        return;
                    } catch (e) {
                        console.error('Failed to parse (or invalid) stored prompts, clearing...', e);
                        localStorage.removeItem(CACHE_KEY);
                    }
                }

                // 2. Fetch from public/prompts.json if strictly needed (first run or reset)
                // Note: In production, you might want to always fetch to check for updates,
                // but for now we prioritize user local storage if it exists.
                console.log('Fetching default prompts from /prompts.json...');
                const response = await fetch('/prompts.json');
                if (!response.ok) throw new Error('Failed to fetch default prompts');

                const defaults = await response.json();
                this.prompts = defaults;

                // Do not auto-save defaults to localStorage anymore.
                // Only user customizations should be saved.

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
     * Reload prompts from source (Reset to defaults)
     */
    async resetToDefaults() {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem('quickstor_system_prompt_custom');
        // Clean up legacy key if present
        localStorage.removeItem('quickstor_system_prompt');
        this.prompts = null;
        this.initializationPromise = null;
        await this.init();
        return this.prompts;
    }
}

export const promptService = new PromptService();
