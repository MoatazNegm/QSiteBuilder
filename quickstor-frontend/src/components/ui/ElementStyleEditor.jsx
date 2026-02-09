import React, { useState, useEffect, useRef } from 'react';
import { X, Type, Paintbrush, Square, AlignLeft } from 'lucide-react';

const ElementStyleEditor = ({ element, position, onClose, onUpdate, onTextUpdate }) => {
    const popoverRef = useRef(null);

    // Extract current styles from element
    const computedStyle = element ? window.getComputedStyle(element) : {};

    const [styles, setStyles] = useState({
        color: '',
        backgroundColor: '',
        borderWidth: '',
        borderColor: '',
        borderRadius: '',
        fontSize: '',
        fontWeight: '',
        fontFamily: ''
    });

    const [textContent, setTextContent] = useState('');

    // Initialize styles from element
    useEffect(() => {
        if (!element) return;

        const computed = window.getComputedStyle(element);
        setStyles({
            color: rgbToHex(computed.color) || '#000000',
            backgroundColor: computed.backgroundColor === 'rgba(0, 0, 0, 0)' ? '' : rgbToHex(computed.backgroundColor),
            borderWidth: parseInt(computed.borderWidth) || 0,
            borderColor: rgbToHex(computed.borderColor) || '#000000',
            borderRadius: parseInt(computed.borderRadius) || 0,
            fontSize: parseInt(computed.fontSize) || 16,
            fontWeight: computed.fontWeight || '400',
            fontFamily: computed.fontFamily?.split(',')[0]?.replace(/['"]/g, '') || 'inherit'
        });

        setTextContent(element.innerText || '');
    }, [element]);

    // Close on click outside - BUT NOT if interacting with color picker or selects
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target) && e.target !== element) {
                // Check if target is inside a portal (like color picker popup if any)
                // For native inputs, this check is sufficient.
                onClose();
            }
        };

        // Use mousedown to capture before click
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [element, onClose]);

    // Helper to convert rgb to hex
    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent') return '';
        if (rgb.startsWith('#')) return rgb;

        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return '';

        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    const handleChange = (key, value) => {
        const newStyles = { ...styles, [key]: value };
        setStyles(newStyles);
        onUpdate(newStyles); // Instant Update
    };

    const handleTextChange = (e) => {
        const newText = e.target.value;
        setTextContent(newText);
        if (onTextUpdate) onTextUpdate(newText); // Instant Text Update
    };

    const handleReset = () => {
        if (element) {
            // Reset logic handled by parent or by clearing specific inline styles
            element.style.color = '';
            element.style.backgroundColor = '';
            element.style.border = '';
            element.style.borderRadius = '';
            element.style.fontSize = '';
            element.style.fontWeight = '';
            element.style.fontFamily = '';
        }
        // Notify parent of reset (pass empty or default)
        // For now, just closing might be enough if we want to cancel? 
        // But user asked for reset.
        // We'll re-read computed styles which might return to CSS defaults
        const computed = window.getComputedStyle(element);
        setStyles({
            color: rgbToHex(computed.color) || '#000000',
            backgroundColor: '',
            borderWidth: 0,
            borderColor: '#000000',
            borderRadius: 0,
            fontSize: parseInt(computed.fontSize) || 16,
            fontWeight: '400',
            fontFamily: 'inherit'
        });
        onUpdate({}); // Clear inline styles
    };

    // Calculate popover position to ensure it stays on screen
    const [popoverStyle, setPopoverStyle] = useState({});

    useEffect(() => {
        if (!position) return;
        const width = 320;
        const height = 500; // Approx max height
        let top = position.y + 10;
        let left = position.x + 10;

        // Flip if off screen
        if (left + width > window.innerWidth) {
            left = window.innerWidth - width - 20;
        }
        if (top + height > window.innerHeight) {
            top = window.innerHeight - height - 20;
        }

        setPopoverStyle({
            position: 'fixed',
            top: top,
            left: left,
            zIndex: 9999
        });
    }, [position]);


    const fontWeightOptions = [
        { value: '300', label: 'Light' },
        { value: '400', label: 'Normal' },
        { value: '500', label: 'Medium' },
        { value: '600', label: 'Semibold' },
        { value: '700', label: 'Bold' },
        { value: '800', label: 'Extra Bold' }
    ];

    const fontFamilyOptions = [
        'inherit',
        'Inter',
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat',
        'Poppins',
        'Raleway',
        'Outfit',
        'Arial',
        'Georgia',
        'Times New Roman'
    ];

    return (
        <div
            ref={popoverRef}
            style={popoverStyle}
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[320px] overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
                <span className="text-white font-semibold text-sm flex items-center gap-2">
                    <Paintbrush size={16} className="text-blue-400" />
                    Style Editor
                </span>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5 overflow-y-auto custom-scrollbar" style={{ maxHeight: '60vh' }}>

                {/* Text Content Editor */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                        <Type size={12} /> Text Content
                    </label>
                    <textarea
                        value={textContent}
                        onChange={handleTextChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm resize-y min-h-[60px] focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="h-px bg-gray-800" />

                {/* Text Color */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500" /> Color & Background
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 block">Text</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={styles.color || '#000000'}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border border-gray-600 p-0"
                                />
                                <input
                                    type="text"
                                    value={styles.color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 block">Background</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={styles.backgroundColor || '#ffffff'}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border border-gray-600 p-0"
                                />
                                <button
                                    onClick={() => handleChange('backgroundColor', '')}
                                    className="text-xs text-gray-400 hover:text-white underline"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Typography */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                        <AlignLeft size={12} /> Typography
                    </label>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-[10px] text-gray-500 block mb-1">Font Family</span>
                                <select
                                    value={styles.fontFamily}
                                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-xs"
                                >
                                    {fontFamilyOptions.map(font => (
                                        <option key={font} value={font}>{font}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 block mb-1">Weight</span>
                                <select
                                    value={styles.fontWeight}
                                    onChange={(e) => handleChange('fontWeight', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-xs"
                                >
                                    {fontWeightOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                <span>Size</span>
                                <span>{styles.fontSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="8"
                                max="72"
                                value={styles.fontSize}
                                onChange={(e) => handleChange('fontSize', e.target.value)}
                                className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Border */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                        <Square size={12} /> Border & Radius
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <span className="text-[10px] text-gray-500 block mb-1">Width</span>
                            <input
                                type="number"
                                min="0"
                                max="20"
                                value={styles.borderWidth}
                                onChange={(e) => handleChange('borderWidth', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                            />
                        </div>
                        <div className="col-span-1">
                            <span className="text-[10px] text-gray-500 block mb-1">Radius</span>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={styles.borderRadius}
                                onChange={(e) => handleChange('borderRadius', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                            />
                        </div>
                        <div className="col-span-1">
                            <span className="text-[10px] text-gray-500 block mb-1">Color</span>
                            <input
                                type="color"
                                value={styles.borderColor || '#000000'}
                                onChange={(e) => handleChange('borderColor', e.target.value)}
                                className="w-full h-7 rounded cursor-pointer border border-gray-600 p-0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 shrink-0 flex justify-end">
                <button
                    onClick={handleReset}
                    className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                >
                    Reset Styles
                </button>
            </div>
        </div>
    );
};

export default ElementStyleEditor;
