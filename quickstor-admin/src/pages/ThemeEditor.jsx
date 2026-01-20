import React, { useState } from 'react';
import { useContentStore } from '../hooks/useContentStore';
import { Palette, Type, Image, Sparkles, Save, Trash2, Check } from 'lucide-react';
import { AIService, getProviderInfo } from '../utils/aiService';

const ColorPicker = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-24 px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-gray-300 font-mono"
            />
        </div>
    </div>
);

const FontSelector = ({ label, value, onChange }) => {
    const fonts = [
        'Inter, system-ui, sans-serif',
        'system-ui, -apple-system, sans-serif',
        'Georgia, serif',
        'Roboto, sans-serif',
        'Montserrat, sans-serif',
        'Poppins, sans-serif',
        'Playfair Display, serif',
        'Source Code Pro, monospace'
    ];

    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded text-gray-300"
            >
                {fonts.map(font => (
                    <option key={font} value={font}>{font.split(',')[0]}</option>
                ))}
            </select>
        </div>
    );
};

export default function ThemeEditor() {
    const {
        activeTheme,
        savedThemes,
        updateTheme,
        saveThemeToLibrary,
        deleteThemeFromLibrary,
        applyTheme
    } = useContentStore();

    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [saveThemeName, setSaveThemeName] = useState('');

    const handleColorChange = (colorKey, value) => {
        updateTheme({ colors: { [colorKey]: value } });
    };

    const handleFontChange = (fontKey, value) => {
        updateTheme({ fonts: { [fontKey]: value } });
    };

    const handleHeroChange = (key, value) => {
        updateTheme({ hero: { [key]: value } });
    };

    const handleSaveTheme = () => {
        const name = saveThemeName.trim() || `Theme ${savedThemes.length + 1}`;
        saveThemeToLibrary(name);
        setSaveThemeName('');
        alert(`Theme "${name}" saved to library!`);
    };

    const generateThemeWithAI = async () => {
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);

        const prompt = `Generate a website color theme based on this description: "${aiPrompt}"

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "colors": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor", 
    "background": "#hexcolor",
    "surface": "#hexcolor",
    "surfaceAlt": "#hexcolor",
    "text": "#hexcolor",
    "textMuted": "#hexcolor",
    "border": "#hexcolor",
    "success": "#22c55e",
    "warning": "#eab308",
    "error": "#ef4444"
  },
  "hero": {
    "backgroundType": "gradient",
    "backgroundValue": "linear-gradient(135deg, #color1 0%, #color2 100%)",
    "glowColor": "#hexcolor",
    "glowOpacity": 0.2
  }
}

Make the theme visually cohesive and professional. Use the primary color as the main accent.`;

        try {
            const response = await AIService.streamContent(prompt, () => { });

            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const themeData = JSON.parse(jsonMatch[0]);
                updateTheme({
                    colors: themeData.colors,
                    hero: themeData.hero
                });
                alert('Theme generated successfully!');
            }
        } catch (error) {
            console.error('AI theme generation error:', error);
            alert('Failed to generate theme: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-full bg-[#111827]">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Theme Editor</h1>
                <p className="text-gray-400">Customize your website's colors, fonts, and hero background.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Colors Panel */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Palette size={18} className="text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Colors</h2>
                    </div>

                    <div className="space-y-1 divide-y divide-gray-800">
                        <ColorPicker label="Primary" value={activeTheme.colors.primary} onChange={(v) => handleColorChange('primary', v)} />
                        <ColorPicker label="Secondary" value={activeTheme.colors.secondary} onChange={(v) => handleColorChange('secondary', v)} />
                        <ColorPicker label="Background" value={activeTheme.colors.background} onChange={(v) => handleColorChange('background', v)} />
                        <ColorPicker label="Surface" value={activeTheme.colors.surface} onChange={(v) => handleColorChange('surface', v)} />
                        <ColorPicker label="Surface Alt" value={activeTheme.colors.surfaceAlt} onChange={(v) => handleColorChange('surfaceAlt', v)} />
                        <ColorPicker label="Text" value={activeTheme.colors.text} onChange={(v) => handleColorChange('text', v)} />
                        <ColorPicker label="Text Muted" value={activeTheme.colors.textMuted} onChange={(v) => handleColorChange('textMuted', v)} />
                        <ColorPicker label="Border" value={activeTheme.colors.border} onChange={(v) => handleColorChange('border', v)} />
                    </div>
                </div>

                {/* Fonts & Hero Panel */}
                <div className="space-y-6">
                    {/* Fonts */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Type size={18} className="text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">Typography</h2>
                        </div>

                        <div className="space-y-1 divide-y divide-gray-800">
                            <FontSelector label="Headings" value={activeTheme.fonts.heading} onChange={(v) => handleFontChange('heading', v)} />
                            <FontSelector label="Body" value={activeTheme.fonts.body} onChange={(v) => handleFontChange('body', v)} />
                        </div>
                    </div>

                    {/* Hero Background */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Image size={18} className="text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">Hero Background</h2>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Type</label>
                                <select
                                    value={activeTheme.hero.backgroundType}
                                    onChange={(e) => handleHeroChange('backgroundType', e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300"
                                >
                                    <option value="solid">Solid Color</option>
                                    <option value="gradient">Gradient</option>
                                    <option value="image">Image URL</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Value</label>
                                <input
                                    type="text"
                                    value={activeTheme.hero.backgroundValue}
                                    onChange={(e) => handleHeroChange('backgroundValue', e.target.value)}
                                    placeholder={activeTheme.hero.backgroundType === 'image' ? 'https://...' : '#050505 or linear-gradient(...)'}
                                    className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 font-mono"
                                />
                            </div>

                            <ColorPicker
                                label="Glow Color"
                                value={activeTheme.hero.glowColor}
                                onChange={(v) => handleHeroChange('glowColor', v)}
                            />
                        </div>
                    </div>
                </div>

                {/* AI & Library Panel */}
                <div className="space-y-6">
                    {/* AI Generator */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-purple-400" />
                            <h2 className="text-lg font-semibold text-white">AI Theme Generator</h2>
                        </div>
                        <div className="mb-3 flex items-center gap-2">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Powered By</div>
                            <div className="text-[10px] text-blue-400 bg-blue-900/30 border border-blue-800 px-2 py-0.5 rounded flex items-center gap-1">
                                {getProviderInfo().name}
                            </div>
                        </div>

                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe your theme... e.g., 'Cyberpunk with neon pink accents' or 'Clean corporate blue'"
                            className="w-full h-24 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 resize-none mb-3"
                        />

                        <button
                            onClick={generateThemeWithAI}
                            disabled={isGenerating || !aiPrompt.trim()}
                            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate Theme
                                </>
                            )}
                        </button>
                    </div>

                    {/* Save Theme */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Save size={18} className="text-green-400" />
                            <h2 className="text-lg font-semibold text-white">Save to Library</h2>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={saveThemeName}
                                onChange={(e) => setSaveThemeName(e.target.value)}
                                placeholder="Theme name..."
                                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300"
                            />
                            <button
                                onClick={handleSaveTheme}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium text-sm transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    {/* Theme Library */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
                        <h2 className="text-lg font-semibold text-white mb-4">Theme Library</h2>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {savedThemes.map((theme) => (
                                <div
                                    key={theme.id}
                                    className={`flex items-center justify-between p-3 rounded border transition-all cursor-pointer ${activeTheme.id === theme.id
                                        ? 'bg-blue-900/20 border-blue-600'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                        }`}
                                    onClick={() => applyTheme(theme)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-600"
                                            style={{ backgroundColor: theme.colors.primary }}
                                        />
                                        <span className="text-sm text-gray-200">{theme.name}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {activeTheme.id === theme.id && (
                                            <Check size={16} className="text-blue-400" />
                                        )}
                                        {theme.id !== 'default' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Delete theme "${theme.name}"?`)) {
                                                        deleteThemeFromLibrary(theme.id);
                                                    }
                                                }}
                                                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Strip */}
            <div className="mt-8 p-6 rounded-lg border border-gray-800" style={{ backgroundColor: activeTheme.colors.background }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: activeTheme.colors.text, fontFamily: activeTheme.fonts.heading }}>
                    Live Preview
                </h3>
                <p className="mb-4" style={{ color: activeTheme.colors.textMuted, fontFamily: activeTheme.fonts.body }}>
                    This is how your theme will look. The primary accent color is used for buttons and highlights.
                </p>
                <div className="flex gap-3">
                    <button
                        className="px-4 py-2 rounded font-medium"
                        style={{ backgroundColor: activeTheme.colors.primary, color: '#ffffff' }}
                    >
                        Primary Button
                    </button>
                    <button
                        className="px-4 py-2 rounded font-medium border"
                        style={{
                            borderColor: activeTheme.colors.border,
                            color: activeTheme.colors.text,
                            backgroundColor: activeTheme.colors.surface
                        }}
                    >
                        Secondary Button
                    </button>
                </div>
            </div>
        </div>
    );
}
