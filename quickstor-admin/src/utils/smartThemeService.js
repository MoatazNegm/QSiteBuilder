
import { AIService } from './aiService';
import { promptService } from './promptService';

/**
 * Smart Theme Service
 * "Smart" deterministic application of theme variables to section content.
 * Replaces previous AI implementation with robust recursive mapping.
 */
export const SmartThemeService = {
    /**
     * Apply theme to a single section
     * @param {object} section - The section object
     * @param {object} theme - The active theme
     * @param {function} onLog - Logger callback
     * @param {number} index - Section index for alternating styles
     * @returns {Promise<object>} - The updated section content
     */
    applyToSection: async (section, theme, onLog, index = 0) => {
        try {
            if (onLog) onLog(`  → Mapping ${section.type || 'Unknown'} (Algorithmic)...`);

            // Recursive Mapping Function
            const mapContent = (obj, contextKey = '') => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map((item, i) => mapContent(item, `${contextKey}[${i}]`));

                const newObj = { ...obj };
                for (const [key, val] of Object.entries(newObj)) {
                    const lowerKey = key.toLowerCase();
                    const fullContext = contextKey ? `${contextKey}.${key}` : key;

                    // 1. Traverse deeper if object
                    if (typeof val === 'object' && val !== null) {
                        newObj[key] = mapContent(val, fullContext);
                        continue;
                    }

                    // 2. Map STRINGS only
                    if (typeof val === 'string') {
                        // --- COLORS ---
                        // Check if it's a color field (by name or value format)
                        const isColorField =
                            lowerKey.includes('color') ||
                            lowerKey.includes('bg') ||
                            lowerKey.includes('background') ||
                            lowerKey.includes('fill') ||
                            lowerKey.includes('stroke') ||
                            lowerKey.includes('border') ||
                            /^#[0-9A-Fa-f]{3,8}$/.test(val) ||
                            val.startsWith('rgb') ||
                            val.startsWith('hsl');

                        if (isColorField) {
                            // A. Backgrounds -> Force Theme Background
                            if (lowerKey.includes('background') || lowerKey.includes('bg') || lowerKey.includes('sectionbg')) {
                                newObj[key] = theme.colors.background;
                            }
                            // B. Titles / Headings -> Alternate Primary/Secondary
                            else if (lowerKey.includes('title') || lowerKey.includes('heading')) {
                                newObj[key] = (index % 2 === 0) ? theme.colors.primary : theme.colors.secondary;
                            }
                            // C. Subtitles / Description -> Text Muted
                            else if (lowerKey.includes('sub') || lowerKey.includes('desc') || lowerKey.includes('muted')) {
                                newObj[key] = theme.colors.textMuted;
                            }
                            // D. Primary CTA -> Primary
                            else if (lowerKey.includes('primary') || lowerKey.includes('cta') || lowerKey.includes('btn') || lowerKey.includes('button')) {
                                if (lowerKey.includes('text')) {
                                    // Button text usually light if primary is dark, but let's assume standard contrast needed
                                    // For simplicity in this algo, we stick to theme text or white?
                                    // Let's use theme.colors.text for now or specific button logic if needed.
                                    // Actually, primary buttons often have white text.
                                    newObj[key] = '#ffffff';
                                } else {
                                    newObj[key] = theme.colors.primary;
                                }
                            }
                            // E. Secondary CTA -> Surface/Border
                            else if (lowerKey.includes('secondary')) {
                                newObj[key] = theme.colors.surface; // or secondary
                            }
                            // F. Borders
                            else if (lowerKey.includes('border') || lowerKey.includes('stroke')) {
                                newObj[key] = theme.colors.border;
                            }
                            // G. Default Text fallback
                            else if (lowerKey.includes('text')) {
                                newObj[key] = theme.colors.text;
                            }
                            // H. Catch-all for other colors found by hex -> Primary (accent)
                            else if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) {
                                newObj[key] = theme.colors.primary;
                            }
                        }

                        // --- FONTS ---
                        if (lowerKey.includes('fontfamily') || lowerKey.includes('font')) {
                            if (lowerKey.includes('heading') || lowerKey.includes('title')) {
                                newObj[key] = theme.fonts.heading || 'Inter, sans-serif';
                            } else {
                                newObj[key] = theme.fonts.body || 'Inter, sans-serif';
                            }
                        }
                    }
                }
                return newObj;
            };

            const updatedContent = mapContent(section.content);

            // SPECIAL HANDLING: For Navbar and Footer, force background color if missing
            // because they might not have color fields by default
            const isGlobalNavOrFooter = section.type === 'NAVBAR' || section.type === 'FOOTER';
            if (isGlobalNavOrFooter) {
                if (!updatedContent.style) updatedContent.style = {};

                // Force theme background + text color for standard components
                // Navbar uses 'bg-theme-background/95' class usually, but style overrides it
                // Footer uses 'bg-black' class, style overrides it
                updatedContent.style.backgroundColor = theme.colors.background;
                updatedContent.style.borderColor = theme.colors.border;

                // Ensure text is readable (if components use style.color)
                // Navbar/Footer components might use specific classes, but setting color here helps inheritance
                updatedContent.style.color = theme.colors.text;

                if (onLog) onLog(`  ✓ ${section.type}: Injected theme background & colors`);
            }

            // Log stats
            if (onLog && !isGlobalNavOrFooter) {
                onLog(`  ✓ ${section.type}: Mapped colors & fonts (Index: ${index})`);
            }

            return Promise.resolve(updatedContent);

        } catch (error) {
            console.error(`Failed to map section ${section.id}:`, error);
            if (onLog) onLog(`  ✗ ${section.type}: Failed - ${error.message}`);
            return Promise.resolve(section.content);
        }
    },

    /**
     * Apply theme to all sections in a page
     * @param {Array} sections - Array of section objects
     * @param {object} theme - The active theme
     * @param {function} onProgress - Callback(current, total)
     * @returns {Promise<Array>} - Array of { id, content } updates
     */
    applyToPage: async (sections, theme, onProgress) => {
        const updates = [];
        let completed = 0;

        for (const section of sections) {
            if (onProgress) onProgress(completed + 1, sections.length, `Processing section ${completed + 1}/${sections.length}: ${section.type || 'Unknown'}`);

            // Pass 'completed' as index to drive alternating logic
            const updatedContent = await SmartThemeService.applyToSection(section, theme, onProgress ? (msg) => onProgress(completed + 1, sections.length, msg) : null, completed);
            updates.push({ id: section.id, content: updatedContent });

            completed++;
        }

        return updates;
    }
};
