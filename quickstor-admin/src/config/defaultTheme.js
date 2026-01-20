/**
 * Default Theme Configuration
 * These values will be used if no theme is saved
 */
export const defaultTheme = {
    id: 'default',
    name: 'QuickStor Dark',
    colors: {
        primary: '#2563eb',        // Blue accent (CTAs, highlights)
        secondary: '#3b82f6',      // Secondary blue
        background: '#050505',     // Page background
        surface: '#0a0a0a',        // Card/component backgrounds
        surfaceAlt: '#151515',     // Alternate surface color
        text: '#ffffff',           // Primary text
        textMuted: '#9ca3af',      // Secondary/muted text
        border: '#1f2937',         // Border color
        success: '#22c55e',        // Success green
        warning: '#eab308',        // Warning yellow
        error: '#ef4444',          // Error red
    },
    fonts: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'system-ui, -apple-system, sans-serif',
    },
    hero: {
        backgroundType: 'gradient',  // 'solid' | 'gradient' | 'image'
        backgroundValue: 'linear-gradient(135deg, #050505 0%, #0a1628 100%)',
        overlayOpacity: 0.5,
        glowColor: '#2563eb',
        glowOpacity: 0.2
    }
};

/**
 * Generate CSS variables from theme object
 * @param {object} theme - Theme configuration object
 * @returns {object} CSS variable key-value pairs
 */
export const themeToCssVariables = (theme) => {
    return {
        '--color-primary': theme.colors.primary,
        '--color-secondary': theme.colors.secondary,
        '--color-background': theme.colors.background,
        '--color-surface': theme.colors.surface,
        '--color-surface-alt': theme.colors.surfaceAlt,
        '--color-text': theme.colors.text,
        '--color-text-muted': theme.colors.textMuted,
        '--color-border': theme.colors.border,
        '--color-success': theme.colors.success,
        '--color-warning': theme.colors.warning,
        '--color-error': theme.colors.error,
        '--font-heading': theme.fonts.heading,
        '--font-body': theme.fonts.body,
        '--hero-bg': theme.hero.backgroundValue,
        '--hero-glow-color': theme.hero.glowColor,
        '--hero-glow-opacity': theme.hero.glowOpacity,
    };
};
