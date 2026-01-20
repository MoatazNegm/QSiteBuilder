import React, { useState } from 'react';
import { Type, Palette, Bold, Check, ChevronDown } from 'lucide-react';
import { Label } from './Label';
import { Input } from './Input';

const PRESET_COLORS = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef',
    '#64748b', '#94a3b8'
];

const StyleControls = ({ styles = {}, onChange }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleChange = (key, value) => {
        onChange({ ...styles, [key]: value });
    };

    const currentColor = styles.color || '#000000';

    return (
        <div className="grid grid-cols-3 gap-3 mt-2">
            {/* Color Picker */}
            <div className="space-y-1.5 relative">
                <Label className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 uppercase tracking-wide">
                    <Palette size={10} /> Color
                </Label>

                <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full h-8 px-2 bg-white border border-gray-200 rounded-md flex items-center gap-2 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                    <div
                        className="w-4 h-4 rounded-full border border-gray-100 shadow-sm shrink-0"
                        style={{ backgroundColor: currentColor }}
                    />
                    <span className="text-xs text-gray-600 font-mono truncate grow text-left">
                        {currentColor}
                    </span>
                </button>

                {/* Custom Popover */}
                {showColorPicker && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowColorPicker(false)}
                        />
                        <div className="absolute top-full left-0 mt-2 z-50 p-3 bg-white border border-gray-200 rounded-lg shadow-xl w-48 animate-in fade-in zoom-in-95 duration-100">
                            <div className="grid grid-cols-6 gap-2 mb-3">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { handleChange('color', c); setShowColorPicker(false); }}
                                        className="w-6 h-6 rounded-full border border-gray-100 hover:scale-110 transition-transform relative group focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    >
                                        {currentColor === c && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <span className="absolute left-2 top-1.5 text-gray-400 text-xs text-[10px]">#</span>
                                <input
                                    type="text"
                                    value={currentColor.replace('#', '')}
                                    onChange={(e) => handleChange('color', `#${e.target.value}`)}
                                    className="w-full h-7 pl-4 pr-2 text-xs border border-gray-200 rounded bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 text-gray-900 font-mono"
                                    placeholder="HEX"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Size Selector */}
            <div className="space-y-1.5">
                <Label className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 uppercase tracking-wide">
                    <Type size={10} /> Size
                </Label>
                <div className="relative">
                    <select
                        value={styles.fontSize || ''}
                        onChange={(e) => handleChange('fontSize', e.target.value)}
                        className="w-full h-8 pl-2 pr-6 text-xs border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer hover:border-gray-300 transition-colors"
                    >
                        <option value="">Default</option>
                        <option value="0.75rem">XS (12px)</option>
                        <option value="0.875rem">SM (14px)</option>
                        <option value="1rem">Base (16px)</option>
                        <option value="1.125rem">LG (18px)</option>
                        <option value="1.25rem">XL (20px)</option>
                        <option value="1.5rem">2XL (24px)</option>
                        <option value="1.875rem">3XL (30px)</option>
                        <option value="2.25rem">4XL (36px)</option>
                        <option value="3rem">5XL (48px)</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Weight Selector */}
            <div className="space-y-1.5">
                <Label className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 uppercase tracking-wide">
                    <Bold size={10} /> Weight
                </Label>
                <div className="relative">
                    <select
                        value={styles.fontWeight || ''}
                        onChange={(e) => handleChange('fontWeight', e.target.value)}
                        className="w-full h-8 pl-2 pr-6 text-xs border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer hover:border-gray-300 transition-colors"
                    >
                        <option value="">Default</option>
                        <option value="300">Light</option>
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">Semibold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extrabold</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default StyleControls;
