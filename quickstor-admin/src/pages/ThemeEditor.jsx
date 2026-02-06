import React, { useState } from 'react';
import { useContentStore } from '../hooks/useContentStore';
import { Palette, Type, Image, Sparkles, Save, Trash2, Check } from 'lucide-react';
import { AIService, getProviderInfo } from '../utils/aiService';
import { promptService } from '../utils/promptService';
import { SmartThemeService } from '../utils/smartThemeService';

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
        applyTheme,
        pages,
        updateSection,
        updatePage,
        navbar,
        updateNavbar,
        footer,
        updateFooter
    } = useContentStore();

    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [saveThemeName, setSaveThemeName] = useState('');
    const [isSmartApplying, setIsSmartApplying] = useState(false);
    const [smartProgress, setSmartProgress] = useState({ current: 0, total: 0 });
    const [progressLogs, setProgressLogs] = useState([]); // Array of log strings

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

        let prompt = promptService.get('theme.generation');
        if (!prompt) {
            // Should be covered by init(), but fallback just in case of race condition or error
            prompt = `Generate a website color theme based on this description: "{{userPrompt}}"\nReturn ONLY a valid JSON object.`;
        }

        prompt = prompt.replace('{{userPrompt}}', aiPrompt);

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

    const handleSmartApply = async () => {
        if (!pages?.length) {
            alert("No pages found.");
            return;
        }

        if (!confirm("This will automatically map the theme colors and fonts to EVERY section on EVERY page.\n\nThis is a destructive operation that replaces custom colors.\n\nContinue?")) return;

        setIsSmartApplying(true);
        setProgressLogs([]); // Clear previous logs
        const addLog = (msg) => setProgressLogs(prev => [...prev, `> ${msg}`]);

        addLog("Initializing Auto-Map sequence...");
        addLog(`Found ${pages.length} pages to process.`);

        // Calculate total sections for progress
        const totalSections = pages.reduce((acc, p) => acc + (p.sections?.length || 0), 0);
        let processedSections = 0;

        setSmartProgress({ current: 0, total: totalSections });

        try {
            // Iterate through ALL pages
            for (const page of pages) {
                if (!page.sections || page.sections.length === 0) continue;

                addLog(`[Page: ${page.title}] Processing ${page.sections.length} sections...`);

                // Apply to this page's sections
                const updates = await SmartThemeService.applyToPage(
                    page.sections,
                    activeTheme,
                    (currentInPage, totalInPage, msg) => {
                        if (msg) addLog(`  - ${msg}`);
                    }
                );

                // Construct new sections array for this page
                const newSections = page.sections.map(section => {
                    const update = updates.find(u => u.id === section.id);
                    if (update) {
                        processedSections++;
                        setSmartProgress({ current: processedSections, total: totalSections });
                        return { ...section, content: update.content };
                    }
                    return section;
                });

                // Update the page in the store
                updatePage(page.id, { sections: newSections });
                addLog(`[Page: ${page.title}] Update complete.`);
            }

            // --- Process Navbar & Footer (Global) ---
            if (navbar) {
                addLog(`Processing Global Navbar...`);
                const updatedNavbar = await SmartThemeService.applyToSection(
                    { type: 'NAVBAR', content: navbar },
                    activeTheme,
                    (msg) => addLog(`  - ${msg}`)
                );
                updateNavbar(updatedNavbar);
                addLog(`Global Navbar updated.`);
            }

            if (footer) {
                addLog(`Processing Global Footer...`);
                // Footer acts as the "last" section, so passing a high index creates alternate contrast if needed.
                const updatedFooter = await SmartThemeService.applyToSection(
                    { type: 'FOOTER', content: footer },
                    activeTheme,
                    (msg) => addLog(`  - ${msg}`),
                    99
                );
                updateFooter(updatedFooter);
                addLog(`Global Footer updated.`);
            }

            addLog("Auto-Map complete! All pages updated.");
            alert(`Successfully smart-applied theme to all ${processedSections} sections across ${pages.length} pages!`);
        } catch (error) {
            console.error("Smart apply failed:", error);
            alert("Failed to apply theme: " + error.message);
        } finally {
            setIsSmartApplying(false);
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
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: activeTheme.colors.text, fontFamily: activeTheme.fonts.heading }}>
                        Live Preview & Smart Apply
                    </h3>

                    <button
                        onClick={handleSmartApply}
                        disabled={isSmartApplying}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded font-medium text-sm transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isSmartApplying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Applying ({smartProgress.current}/{smartProgress.total})
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} className="text-yellow-300" />
                                Auto-Map Theme to All Pages
                            </>
                        )}
                    </button>
                </div>

                {/* Progress Log Console */}
                {isSmartApplying && (
                    <div className="mb-4 bg-black rounded border border-gray-800 p-3 font-mono text-xs max-h-48 overflow-y-auto shadow-inner">
                        <div className="text-gray-500 mb-2 border-b border-gray-800 pb-1">System Log:</div>
                        <div className="space-y-1">
                            {progressLogs.map((log, i) => (
                                <div key={i} className={`${log.startsWith('>') ? 'text-blue-400' : 'text-gray-300 ml-2'}`}>
                                    {log}
                                </div>
                            ))}
                            <div className="animate-pulse text-blue-500 mt-2">_</div>
                        </div>
                    </div>
                )}

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
