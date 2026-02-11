import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, MousePointer2, Move } from 'lucide-react';
import { cn } from '../../utils/cn';

// Pre-built UI elements catalog
const ELEMENT_CATALOG = [
    {
        id: 'round-button',
        name: 'Round Button',
        category: 'Buttons',
        html: '<button class="px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-colors shadow-lg">Click Me</button>'
    },
    {
        id: 'square-button',
        name: 'Square Button',
        category: 'Buttons',
        html: '<button class="px-6 py-3 bg-gray-900 text-white font-semibold rounded-md hover:bg-gray-800 transition-colors">Action</button>'
    },
    {
        id: 'pill-button',
        name: 'Pill Button',
        category: 'Buttons',
        html: '<button class="px-8 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full hover:opacity-90 transition-opacity">Get Started</button>'
    },
    {
        id: 'outline-button',
        name: 'Outline Button',
        category: 'Buttons',
        html: '<button class="px-6 py-3 bg-transparent border-2 border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-500 hover:text-white transition-colors">Learn More</button>'
    },
    {
        id: 'arrow-right',
        name: 'Arrow Right',
        category: 'Arrows',
        html: '<div class="inline-flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full cursor-pointer hover:bg-blue-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></div>'
    },
    {
        id: 'arrow-left',
        name: 'Arrow Left',
        category: 'Arrows',
        html: '<div class="inline-flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full cursor-pointer hover:bg-blue-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg></div>'
    },
    {
        id: 'arrow-down',
        name: 'Arrow Down',
        category: 'Arrows',
        html: '<div class="inline-flex items-center justify-center w-12 h-12 bg-gray-800 text-white rounded-full cursor-pointer hover:bg-gray-700 transition-colors animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg></div>'
    },
    {
        id: 'badge',
        name: 'Badge',
        category: 'Labels',
        html: '<span class="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">New</span>'
    },
    {
        id: 'tag',
        name: 'Tag',
        category: 'Labels',
        html: '<span class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md">Featured</span>'
    },
    {
        id: 'chip',
        name: 'Chip',
        category: 'Labels',
        html: '<span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-full"><span class="w-2 h-2 bg-green-500 rounded-full"></span>Active</span>'
    },
    {
        id: 'divider-horizontal',
        name: 'Horizontal Divider',
        category: 'Dividers',
        html: '<div class="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-4"></div>'
    },
    {
        id: 'divider-fancy',
        name: 'Fancy Divider',
        category: 'Dividers',
        html: '<div class="flex items-center gap-4 my-4"><div class="flex-1 h-px bg-gray-300"></div><div class="w-2 h-2 bg-gray-400 rounded-full"></div><div class="flex-1 h-px bg-gray-300"></div></div>'
    },
    {
        id: 'icon-star',
        name: 'Star Icon',
        category: 'Icons',
        html: '<div class="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 text-yellow-500 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></div>'
    },
    {
        id: 'icon-heart',
        name: 'Heart Icon',
        category: 'Icons',
        html: '<div class="inline-flex items-center justify-center w-10 h-10 bg-red-100 text-red-500 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div>'
    },
    {
        id: 'card-simple',
        name: 'Simple Card',
        category: 'Cards',
        html: '<div class="p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-xs"><h3 class="text-lg font-bold text-gray-900 mb-2">Card Title</h3><p class="text-gray-600 text-sm">This is a simple card component you can customize.</p></div>'
    }
];

const ElementLibrary = ({ isOpen, onClose }) => {
    const panelRef = useRef(null);
    const [pos, setPos] = useState({ x: 80, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef({ x: 0, y: 0 });

    // --- Panel Drag Logic ---
    const handleMouseDown = useCallback((e) => {
        // Only drag from header area
        if (!e.target.closest('[data-drag-handle]')) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startPosRef.current = { ...pos };
    }, [pos]);

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e) => {
            setPos({
                x: startPosRef.current.x + (e.clientX - dragStartRef.current.x),
                y: startPosRef.current.y + (e.clientY - dragStartRef.current.y)
            });
        };
        const handleMouseUp = () => setIsDragging(false);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isOpen) return null;

    const categories = [...new Set(ELEMENT_CATALOG.map(el => el.category))];

    const handleDragStart = (e, element) => {
        e.dataTransfer.setData('text/html', element.html);
        e.dataTransfer.setData('application/element-library', JSON.stringify(element));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return ReactDOM.createPortal(
        <div
            ref={panelRef}
            style={{
                position: 'fixed',
                top: pos.y,
                left: pos.x,
                zIndex: 9998,
                cursor: isDragging ? 'grabbing' : 'auto'
            }}
            className="w-72 max-h-[calc(100vh-4rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col select-none"
            onMouseDown={handleMouseDown}
        >
            {/* Header - Drag Handle */}
            <div
                data-drag-handle="true"
                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white cursor-grab active:cursor-grabbing shrink-0"
            >
                <div className="flex items-center gap-2">
                    <MousePointer2 size={16} />
                    <span className="font-semibold text-sm">Element Library</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-70 flex items-center gap-1">
                        <Move size={10} /> Drag
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="Close (A)"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 shrink-0">
                Drag elements onto the preview. Double-click placed elements to edit text.
            </div>

            {/* Element Categories */}
            <div className="overflow-y-auto flex-1 p-2 space-y-3">
                {categories.map(category => (
                    <div key={category}>
                        <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-2 mb-2">
                            {category}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {ELEMENT_CATALOG.filter(el => el.category === category).map(element => (
                                <div
                                    key={element.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, element)}
                                    className={cn(
                                        "p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing transition-all",
                                        "hover:border-blue-300 hover:shadow-sm",
                                        "flex flex-col items-center gap-2 text-center"
                                    )}
                                    title={`Drag to add: ${element.name}`}
                                >
                                    {/* Mini Preview */}
                                    <div
                                        className="w-full h-10 flex items-center justify-center overflow-hidden pointer-events-none transform scale-75"
                                        dangerouslySetInnerHTML={{ __html: element.html }}
                                    />
                                    <span className="text-[10px] text-gray-600 font-medium truncate w-full">
                                        {element.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
};

export default ElementLibrary;
