/**
 * Default Theme Configuration (Frontend)
 * Matches the admin defaultTheme.js structure
 */
export const defaultTheme = {
    id: 'default',
    name: 'QuickStor Dark',
    colors: {
        primary: '#2563eb',
        secondary: '#3b82f6',
        background: '#050505',
        surface: '#0a0a0a',
        surfaceAlt: '#151515',
        text: '#ffffff',
        textMuted: '#9ca3af',
        border: '#1f2937',
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
    },
    fonts: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'system-ui, -apple-system, sans-serif',
    },
    hero: {
        backgroundType: 'gradient',
        backgroundValue: 'linear-gradient(135deg, #050505 0%, #0a1628 100%)',
        overlayOpacity: 0.5,
        glowColor: '#2563eb',
        glowOpacity: 0.2
    }
};

/**
 * Apply theme to document by setting CSS custom properties
 * @param {object} theme - Theme configuration object
 */
export const applyThemeToDocument = (theme) => {
    if (!theme || !theme.colors) return;

    const root = document.documentElement;

    // Apply colors
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-surface-alt', theme.colors.surfaceAlt);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-muted', theme.colors.textMuted);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);

    // Apply fonts
    if (theme.fonts) {
        root.style.setProperty('--font-heading', theme.fonts.heading);
        root.style.setProperty('--font-body', theme.fonts.body);
    }

    // Apply hero-specific
    if (theme.hero) {
        root.style.setProperty('--hero-bg', theme.hero.backgroundValue);
        root.style.setProperty('--hero-glow-color', theme.hero.glowColor);
        root.style.setProperty('--hero-glow-opacity', theme.hero.glowOpacity);
    }

    console.log('Theme applied:', theme.name);
};
