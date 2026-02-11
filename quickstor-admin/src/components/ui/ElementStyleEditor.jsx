import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, Type, Paintbrush, Square, AlignLeft, Move, Undo2, Redo2 } from 'lucide-react';
import { cn } from '../../utils/cn';

// Global history map: keyed by element reference, stores { past: [], future: [] }
const historyMap = new WeakMap();

const MAX_HISTORY = 10;

const ElementStyleEditor = ({ element, position, onClose, onUpdate, onTextUpdate }) => {
    const popoverRef = useRef(null);

    // Extract current styles from element
    const computedStyle = element ? window.getComputedStyle(element) : {};

    // --- Undo / Redo ---
    const [historyVersion, setHistoryVersion] = useState(0); // triggers re-render on undo/redo

    const getHistory = useCallback(() => {
        if (!element) return { past: [], future: [] };
        if (!historyMap.has(element)) {
            historyMap.set(element, { past: [], future: [] });
        }
        return historyMap.get(element);
    }, [element]);

    // Snapshot the element's current inline styles + computed styles
    const takeSnapshot = useCallback(() => {
        if (!element) return;
        const history = getHistory();
        const snapshot = {
            cssText: element.style.cssText,
            innerHTML: element.innerHTML
        };
        history.past.push(snapshot);
        // Trim to max
        if (history.past.length > MAX_HISTORY) {
            history.past.shift();
        }
        // Clear future on new change
        history.future = [];
        setHistoryVersion(v => v + 1);
    }, [element, getHistory]);

    // Restore a snapshot to the element
    const restoreSnapshot = useCallback((snapshot) => {
        if (!element || !snapshot) return;
        element.style.cssText = snapshot.cssText;
        if (snapshot.innerHTML !== undefined) {
            element.innerHTML = snapshot.innerHTML;
            setTextContent(element.innerText);
        }
        // Re-read computed styles into local state
        const computed = window.getComputedStyle(element);
        const bgImage = computed.backgroundImage || '';
        const hasBgGradient = bgImage.includes('linear-gradient');
        let bgGFrom = '#3b82f6', bgGTo = '#8b5cf6', bgGDir = 'to right';
        if (hasBgGradient) {
            const gradMatch = bgImage.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
            if (gradMatch) {
                bgGDir = gradMatch[1].trim();
                bgGFrom = rgbToHex(gradMatch[2].trim()) || '#3b82f6';
                bgGTo = rgbToHex(gradMatch[3].trim()) || '#8b5cf6';
            }
        }

        const webkitBgClip = computed.webkitBackgroundClip || '';
        const hasTextGradient = webkitBgClip === 'text';

        setStyles({
            color: rgbToHex(computed.color) || '#000000',
            backgroundColor: computed.backgroundColor === 'rgba(0, 0, 0, 0)' ? '' : rgbToHex(computed.backgroundColor),
            opacity: Math.round(parseFloat(computed.opacity) * 100) || 100,
            borderWidth: parseInt(computed.borderWidth) || 0,
            borderColor: rgbToHex(computed.borderColor) || '#000000',
            borderRadius: parseInt(computed.borderRadius) || 0,
            fontSize: parseInt(computed.fontSize) || 16,
            fontWeight: computed.fontWeight || '400',
            fontFamily: computed.fontFamily?.split(',')[0]?.replace(/['\"/]/g, '') || 'inherit',
            bgGradientEnabled: hasBgGradient && !hasTextGradient,
            bgGradientFrom: bgGFrom,
            bgGradientTo: bgGTo,
            bgGradientDirection: bgGDir,
            textGradientEnabled: hasTextGradient,
            textGradientFrom: hasTextGradient ? bgGFrom : '#3b82f6',
            textGradientTo: hasTextGradient ? bgGTo : '#ec4899',
            textGradientDirection: hasTextGradient ? bgGDir : 'to right'
        });
    }, [element]);

    const handleUndo = useCallback(() => {
        const history = getHistory();
        if (history.past.length === 0) return;
        // Save current state to future
        history.future.push({
            cssText: element.style.cssText,
            innerHTML: element.innerHTML
        });
        const prev = history.past.pop();
        restoreSnapshot(prev);
        setHistoryVersion(v => v + 1);
    }, [element, getHistory, restoreSnapshot]);

    const handleRedo = useCallback(() => {
        const history = getHistory();
        if (history.future.length === 0) return;
        // Save current state to past
        history.past.push({
            cssText: element.style.cssText,
            innerHTML: element.innerHTML
        });
        const next = history.future.pop();
        restoreSnapshot(next);
        setHistoryVersion(v => v + 1);
    }, [element, getHistory, restoreSnapshot]);

    // Keyboard shortcut: Ctrl+Z / Ctrl+Shift+Z
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    const [styles, setStyles] = useState({
        color: '',
        backgroundColor: '',
        opacity: 100,
        borderWidth: '',
        borderColor: '',
        borderRadius: '',
        fontSize: '',
        fontWeight: '',
        fontFamily: '',
        // Gradient fields
        bgGradientEnabled: false,
        bgGradientFrom: '#3b82f6',
        bgGradientTo: '#8b5cf6',
        bgGradientDirection: 'to right',
        textGradientEnabled: false,
        textGradientFrom: '#3b82f6',
        textGradientTo: '#ec4899',
        textGradientDirection: 'to right'
    });

    const [textContent, setTextContent] = useState('');

    // --- DRAG LOGIC ---
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialPosRef = useRef({ x: 0, y: 0 });

    // Initialize styles from element
    useEffect(() => {
        if (!element) return;

        const computed = window.getComputedStyle(element);
        setStyles({
            color: rgbToHex(computed.color) || '#000000',
            backgroundColor: computed.backgroundColor === 'rgba(0, 0, 0, 0)' ? '' : rgbToHex(computed.backgroundColor),
            opacity: Math.round(parseFloat(computed.opacity) * 100) || 100,
            borderWidth: parseInt(computed.borderWidth) || 0,
            borderColor: rgbToHex(computed.borderColor) || '#000000',
            borderRadius: parseInt(computed.borderRadius) || 0,
            fontSize: parseInt(computed.fontSize) || 16,
            fontWeight: computed.fontWeight || '400',
            fontFamily: computed.fontFamily?.split(',')[0]?.replace(/['"]/g, '') || 'inherit'
        });

        setTextContent(element.innerText || '');
    }, [element]);

    // Initialize Position (On Mount or New Target)
    useEffect(() => {
        if (!position) return;

        // Default position logic (clamp to screen)
        const width = 320;
        const height = 500;
        let top = position.y + 10;
        let left = position.x + 10;

        if (left + width > window.innerWidth) {
            left = window.innerWidth - width - 20;
        }
        if (top + height > window.innerHeight) {
            top = window.innerHeight - height - 20;
        }

        setPos({ x: left, y: top });
    }, [position]); // Only reset when 'position' prop changes (new element clicked)

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


    // Handlers for Dragging
    const handleMouseDown = (e) => {
        // Prevent dragging only if interacting with actual inputs/buttons
        if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
            return;
        }
        // Also check if type="color" or type="range"
        if (e.target.type === 'color' || e.target.type === 'range') return;

        // Allow dragging from labels and other non-interactive elements
        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent parent handlers (wrapper selection, etc.)
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialPosRef.current = { ...pos };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        setPos({
            x: initialPosRef.current.x + dx,
            y: initialPosRef.current.y + dy
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };


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
        takeSnapshot(); // Save current state before change
        const newStyles = { ...styles, [key]: value };
        setStyles(newStyles);
        onUpdate(newStyles); // Instant Update
    };

    const handleTextChange = (e) => {
        takeSnapshot(); // Save current state before text change
        const newText = e.target.value;
        setTextContent(newText);
        if (onTextUpdate) onTextUpdate(newText); // Instant Text Update
    };

    const handleReset = () => {
        if (element) {
            takeSnapshot(); // Save before reset
            // Reset logic handled by parent or by clearing specific inline styles
            element.style.color = '';
            element.style.backgroundColor = '';
            element.style.border = '';
            element.style.borderRadius = '';
            element.style.fontSize = '';
            element.style.fontWeight = '';
            element.style.fontFamily = '';
        }

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

    const history = getHistory();
    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;


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

    // Use React Portal to render outside of parent transforms (which cause position:fixed to fail)
    return ReactDOM.createPortal(
        <div
            ref={popoverRef}
            style={{
                position: 'fixed',
                top: pos.y,
                left: pos.x,
                zIndex: 9999,
                cursor: isDragging ? 'grabbing' : 'auto'
            }}
            className={cn(
                "bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[320px] overflow-hidden flex flex-col select-none", // select-none to prevent text selection during drag
                isDragging && "shadow-blue-500/20"
            )}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0 cursor-grab active:cursor-grabbing">
                <span className="text-white font-semibold text-sm flex items-center gap-2">
                    <Paintbrush size={16} className="text-blue-400" />
                    Style Editor
                </span>
                <div className="flex items-center gap-1">
                    {/* Undo / Redo Buttons */}
                    <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className={cn(
                            "p-1 rounded transition-colors relative",
                            canUndo ? "text-blue-400 hover:text-white hover:bg-gray-700" : "text-gray-600 cursor-not-allowed"
                        )}
                        title={`Undo (${history.past.length})`}
                    >
                        <Undo2 size={14} />
                        {canUndo && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{history.past.length}</span>}
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className={cn(
                            "p-1 rounded transition-colors relative",
                            canRedo ? "text-blue-400 hover:text-white hover:bg-gray-700" : "text-gray-600 cursor-not-allowed"
                        )}
                        title={`Redo (${history.future.length})`}
                    >
                        <Redo2 size={14} />
                        {canRedo && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{history.future.length}</span>}
                    </button>
                    <div className="w-px h-3 bg-gray-700 mx-1" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1">
                        <Move size={10} /> Drag
                    </span>
                    <div className="w-px h-3 bg-gray-700 mx-1" />
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5 overflow-y-auto custom-scrollbar cursor-default" style={{ maxHeight: '60vh' }}>

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

                    {/* --- Text Color --- */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">Text Color</span>
                            <button
                                onClick={() => handleChange('textGradientEnabled', !styles.textGradientEnabled)}
                                className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded-full border transition-colors",
                                    styles.textGradientEnabled
                                        ? "bg-purple-500/20 border-purple-500 text-purple-300"
                                        : "bg-gray-800 border-gray-600 text-gray-500 hover:text-gray-300"
                                )}
                            >
                                {styles.textGradientEnabled ? '✦ Gradient' : 'Solid'}
                            </button>
                        </div>

                        {!styles.textGradientEnabled ? (
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
                        ) : (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <input type="color" value={styles.textGradientFrom} onChange={(e) => handleChange('textGradientFrom', e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-gray-600 p-0" />
                                    <span className="text-gray-600 text-[10px]">→</span>
                                    <input type="color" value={styles.textGradientTo} onChange={(e) => handleChange('textGradientTo', e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-gray-600 p-0" />
                                    <select
                                        value={styles.textGradientDirection}
                                        onChange={(e) => handleChange('textGradientDirection', e.target.value)}
                                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-[10px]"
                                    >
                                        <option value="to right">→</option>
                                        <option value="to left">←</option>
                                        <option value="to bottom">↓</option>
                                        <option value="to top">↑</option>
                                        <option value="to bottom right">↘</option>
                                        <option value="to bottom left">↙</option>
                                        <option value="to top right">↗</option>
                                        <option value="to top left">↖</option>
                                    </select>
                                </div>
                                {/* Live preview */}
                                <div className="h-3 rounded-full" style={{ background: `linear-gradient(${styles.textGradientDirection}, ${styles.textGradientFrom}, ${styles.textGradientTo})` }} />
                            </div>
                        )}
                    </div>

                    {/* --- Background --- */}
                    <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">Background</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleChange('bgGradientEnabled', !styles.bgGradientEnabled)}
                                    className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded-full border transition-colors",
                                        styles.bgGradientEnabled
                                            ? "bg-purple-500/20 border-purple-500 text-purple-300"
                                            : "bg-gray-800 border-gray-600 text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    {styles.bgGradientEnabled ? '✦ Gradient' : 'Solid'}
                                </button>
                                <button
                                    onClick={() => {
                                        handleChange('backgroundColor', '');
                                        handleChange('bgGradientEnabled', false);
                                    }}
                                    className="text-[9px] text-gray-500 hover:text-white px-1"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {!styles.bgGradientEnabled ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={styles.backgroundColor || '#ffffff'}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border border-gray-600 p-0"
                                />
                                <input
                                    type="text"
                                    value={styles.backgroundColor || ''}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    placeholder="transparent"
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                                />
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <input type="color" value={styles.bgGradientFrom} onChange={(e) => handleChange('bgGradientFrom', e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-gray-600 p-0" />
                                    <span className="text-gray-600 text-[10px]">→</span>
                                    <input type="color" value={styles.bgGradientTo} onChange={(e) => handleChange('bgGradientTo', e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-gray-600 p-0" />
                                    <select
                                        value={styles.bgGradientDirection}
                                        onChange={(e) => handleChange('bgGradientDirection', e.target.value)}
                                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-[10px]"
                                    >
                                        <option value="to right">→</option>
                                        <option value="to left">←</option>
                                        <option value="to bottom">↓</option>
                                        <option value="to top">↑</option>
                                        <option value="to bottom right">↘</option>
                                        <option value="to bottom left">↙</option>
                                        <option value="to top right">↗</option>
                                        <option value="to top left">↖</option>
                                    </select>
                                </div>
                                {/* Live preview */}
                                <div className="h-3 rounded-full" style={{ background: `linear-gradient(${styles.bgGradientDirection}, ${styles.bgGradientFrom}, ${styles.bgGradientTo})` }} />
                            </div>
                        )}
                    </div>

                    {/* Opacity Slider */}
                    <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>Opacity</span>
                            <span>{styles.opacity}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={styles.opacity}
                            onChange={(e) => handleChange('opacity', parseInt(e.target.value))}
                            className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
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
            <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 shrink-0 flex justify-end cursor-default">
                <button
                    onClick={handleReset}
                    className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                >
                    Reset Styles
                </button>
            </div>
        </div>,
        document.body
    );
};

export default ElementStyleEditor;
