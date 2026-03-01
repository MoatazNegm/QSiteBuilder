
/**
 * Convert RGB/RGBA string to Hex
 * @param {string} rgb - e.g. "rgb(255, 0, 0)" or "rgba(255, 0, 0, 0.5)"
 * @returns {string} Hex color string e.g. "#ff0000"
 */
export const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '';
    if (rgb.startsWith('#')) return rgb;

    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '';

    const r = (+match[1]).toString(16).padStart(2, '0');
    const g = (+match[2]).toString(16).padStart(2, '0');
    const b = (+match[3]).toString(16).padStart(2, '0');

    return "#" + r + g + b;
};

/**
 * Parse element styles into a normalized object for the editor state
 * @param {HTMLElement} element 
 * @returns {Object} Style state object
 */
export const parseElementStyles = (element) => {
    if (!element) return {};

    const computed = window.getComputedStyle(element);
    const bgImage = computed.backgroundImage || '';
    const hasBgGradient = bgImage.includes('linear-gradient');

    let bgGFrom = '#3b82f6', bgGTo = '#8b5cf6', bgGDir = 'to right';

    if (hasBgGradient) {
        const gradMatch = bgImage.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
        if (gradMatch) {
            bgGDir = gradMatch[1].trim();
            // Try to parse colors from gradient string (simplified)
            // Complex gradient parsing is hard, we'll try basic extraction
            // e.g. "to right, rgb(59, 130, 246), rgb(139, 92, 246)"
            // The match above assumes simple structure. 
            // Better approach might be just defaults if parsing fails or relying on known structure from our own generator.

            // Just use defaults if parsing fails for now to avoid crashes
            bgGFrom = '#3b82f6';
            bgGTo = '#8b5cf6';
        }
    }

    const webkitBgClip = computed.webkitBackgroundClip || '';
    const hasTextGradient = webkitBgClip === 'text';

    return {
        color: rgbToHex(computed.color) || '#000000',
        backgroundColor: computed.backgroundColor === 'rgba(0, 0, 0, 0)' ? '' : rgbToHex(computed.backgroundColor),
        opacity: Math.round(parseFloat(computed.opacity) * 100) || 100,
        borderWidth: parseInt(computed.borderWidth) || 0,
        borderColor: rgbToHex(computed.borderColor) || '#000000',
        borderRadius: parseInt(computed.borderRadius) || 0,
        fontSize: parseInt(computed.fontSize) || 16,
        fontWeight: computed.fontWeight || '400',
        fontFamily: computed.fontFamily?.split(',')[0]?.replace(/['"]/g, '') || 'inherit',

        // Gradient fields
        bgGradientEnabled: hasBgGradient && !hasTextGradient,
        bgGradientFrom: bgGFrom,
        bgGradientTo: bgGTo,
        bgGradientDirection: bgGDir,

        textGradientEnabled: hasTextGradient,
        textGradientFrom: hasTextGradient ? bgGFrom : '#3b82f6',
        textGradientTo: hasTextGradient ? bgGTo : '#ec4899',
        textGradientDirection: hasTextGradient ? bgGDir : 'to right'
    };
};
