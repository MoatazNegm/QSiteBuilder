import React, { useEffect } from 'react';

/**
 * FontLoader
 * Automatically scans the provided content (sections, navbar, footer, theme)
 * for 'fontFamily' properties and loads them from Google Fonts.
 */
const FontLoader = ({ sections = [], navbar, footer, theme }) => {
    useEffect(() => {
        const fontsToLoad = new Set();

        // Helper to recursively find font families
        const scanForFonts = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            // Check for fontFamily in styles
            if (obj.fontFamily && typeof obj.fontFamily === 'string') {
                fontsToLoad.add(obj.fontFamily);
            }

            // Common style objects might have it nested
            if (obj.style && obj.style.fontFamily) {
                fontsToLoad.add(obj.style.fontFamily);
            }

            // Recursively scan arrays and objects
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'object') {
                    scanForFonts(obj[key]);
                }
            });
        };

        // 1. Scan Sections
        sections.forEach(section => scanForFonts(section));

        // 2. Scan Navbar & Footer
        if (navbar) scanForFonts(navbar);
        if (footer) scanForFonts(footer);

        // 3. Scan Theme Defaults
        if (theme && theme.fonts) {
            Object.values(theme.fonts).forEach(font => fontsToLoad.add(font));
        }

        // Process fonts
        const uniqueFonts = Array.from(fontsToLoad)
            .map(fontStr => {
                // Extract the primary font name (before the first comma)
                // e.g. "Roboto Slab, serif" -> "Roboto Slab"
                return fontStr.split(',')[0].trim().replace(/['"]/g, '');
            })
            .filter(font => {
                // Filter out system fonts and common websafe fonts to avoid bad requests
                const systemFonts = [
                    'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
                    'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
                    'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact',
                    'system-ui', '-apple-system', 'sans-serif', 'serif', 'monospace'
                ];
                return font && !systemFonts.includes(font);
            });

        if (uniqueFonts.length === 0) return;

        // Construct Google Fonts URL
        // standard query: family=Font1:wght@300;400;700&family=Font2...
        // simpler: family=Font1&family=Font2
        const fontQueries = uniqueFonts.map(font => `family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700`);
        const href = `https://fonts.googleapis.com/css2?${fontQueries.join('&')}&display=swap`;

        // Check if this link already exists
        let link = document.getElementById('quickstor-dynamic-fonts');
        if (!link) {
            link = document.createElement('link');
            link.id = 'quickstor-dynamic-fonts';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Only update if changed
        if (link.href !== href) {
            link.href = href;
            console.log(`[FontLoader] Loading fonts: ${uniqueFonts.join(', ')}`);
        }

    }, [sections, navbar, footer, theme]); // Re-run when content changes

    return null; // This component renders nothing visually
};

export default FontLoader;
