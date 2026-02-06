import React from 'react';
import { Trash2, ArrowUp, ArrowDown, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const VisualSectionWrapper = ({
    children,
    isSelected,
    onSelect,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    label,
    scale = 1,
    onScaleChange,
    x = 0,
    y = 0,
    onPositionChange
}) => {
    // --- Resizing Logic ---
    const [isResizing, setIsResizing] = React.useState(false);
    const startY = React.useRef(0);
    const startScale = React.useRef(1);

    const handleMouseDown = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        startY.current = e.clientY;
        startScale.current = scale || 1;

        // Add global listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        const deltaY = e.clientY - startY.current;
        // Sensitivity: 500px drag = +1.0 scale change (approx)
        const newScale = Math.max(0.5, Math.min(3, startScale.current + (deltaY * 0.002)));
        if (onScaleChange) {
            onScaleChange(newScale);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // --- Drag Positioning Logic ---
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStart = React.useRef({ x: 0, y: 0 });
    const startPos = React.useRef({ x: 0, y: 0 });

    const handleDragStart = (e) => {
        e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        startPos.current = { x: x || 0, y: y || 0 };

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    };

    const handleDragMove = (e) => {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;

        const newX = startPos.current.x + deltaX;
        const newY = startPos.current.y + deltaY;

        if (onPositionChange) {
            onPositionChange(newX, newY);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
    };

    return (
        <div
            className={cn(
                "relative group transition-all duration-200 mb-4 inline-block align-top", // inline-block for side-by-side
                isSelected ? "ring-2 ring-blue-500 z-10" : "hover:ring-1 hover:ring-blue-300"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            style={{
                zoom: scale, // Use Zoom for layout-affecting scale
                transform: `translate(${x}px, ${y}px)`,
                position: (x !== 0 || y !== 0) ? 'relative' : 'relative',
                zIndex: isDragging || isResizing ? 50 : (isSelected ? 40 : 1),
                width: 'auto',
                maxWidth: '100%'
            }}
        >
            {/* Selection Overlay (Click catcher) */}
            {!isSelected && !isResizing && (
                <div className="absolute inset-0 bg-transparent z-[5] cursor-pointer" />
            )}

            {/* Top Drag Handle (Label) */}
            <div
                className={cn(
                    "absolute left-0 bottom-full mb-0 z-20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-t-md flex items-center gap-2 select-none",
                    isSelected
                        ? "bg-blue-500 text-white cursor-move"
                        : "bg-gray-200 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                )}
                onMouseDown={isSelected ? handleDragStart : undefined}
                title={isSelected ? "Drag to Move" : ""}
                style={{ zoom: 1 / scale }}
            >
                {label || 'Section'}
                {scale !== 1 && <span className="opacity-75 text-[9px]">({Math.round(scale * 100)}%)</span>}
                {(x !== 0 || y !== 0) && <span className="opacity-75 text-[9px]">[{Math.round(x)}, {Math.round(y)}]</span>}
            </div>

            {/* Right Drag Handle */}
            <div
                className={cn(
                    "absolute top-1/2 -right-3 -translate-y-1/2 w-3 h-12 rounded-r-md z-20 flex items-center justify-center select-none",
                    isSelected
                        ? "bg-blue-500 text-white cursor-move hover:bg-blue-600"
                        : "hidden"
                )}
                onMouseDown={isSelected ? handleDragStart : undefined}
                title="Drag to Move"
                style={{ zoom: 1 / scale }}
            >
                <div className="w-0.5 h-6 bg-white/50 rounded-full" />
            </div>

            {/* Bottom Drag Handle */}
            <div
                className={cn(
                    "absolute left-1/2 -bottom-3 -translate-x-1/2 h-3 w-12 rounded-b-md z-20 flex items-center justify-center select-none",
                    isSelected
                        ? "bg-blue-500 text-white cursor-move hover:bg-blue-600"
                        : "hidden"
                )}
                onMouseDown={isSelected ? handleDragStart : undefined}
                title="Drag to Move"
                style={{ zoom: 1 / scale }}
            >
                <div className="h-0.5 w-6 bg-white/50 rounded-full" />
            </div>

            {/* Left Drag Handle */}
            <div
                className={cn(
                    "absolute top-1/2 -left-3 -translate-y-1/2 w-3 h-12 rounded-l-md z-20 flex items-center justify-center select-none",
                    isSelected
                        ? "bg-blue-500 text-white cursor-move hover:bg-blue-600"
                        : "hidden"
                )}
                onMouseDown={isSelected ? handleDragStart : undefined}
                title="Drag to Move"
                style={{ zoom: 1 / scale }}
            >
                <div className="w-0.5 h-6 bg-white/50 rounded-full" />
            </div>


            {/* Scale Handle (Bottom Right) - Functional */}
            {isSelected && (
                <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-blue-600 shadow-md rounded-sm z-30 cursor-se-resize flex items-center justify-center hover:scale-125 transition-transform"
                    onMouseDown={handleMouseDown}
                    title="Drag to Scale"
                    style={{ zoom: 1 / scale }}
                >
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full pointer-events-none" />
                </div>
            )}

            {/* Additional Handles (Visual Listeners) - mapped to same resize logic for now for simpler UX */}
            {isSelected && (
                <>
                    {/* Top Left */}
                    <div
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 shadow-sm rounded-sm z-20 cursor-nw-resize"
                        title="Scale (Fixed Anchor)"
                        style={{ zoom: 1 / scale }}
                    />
                    {/* Top Right */}
                    <div
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 shadow-sm rounded-sm z-20 cursor-ne-resize"
                        title="Scale (Fixed Anchor)"
                        style={{ zoom: 1 / scale }}
                    />
                    {/* Bottom Left */}
                    <div
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 shadow-sm rounded-sm z-20 cursor-sw-resize"
                        title="Scale (Fixed Anchor)"
                        style={{ zoom: 1 / scale }}
                    />
                </>
            )}

            {/* Action Toolbar */}
            <div className={cn(
                "absolute right-2 top-2 z-20 flex items-center gap-1 p-1 rounded-md shadow-sm transition-opacity",
                isSelected
                    ? "bg-blue-500 text-white opacity-100"
                    : "bg-white text-gray-600 opacity-0 group-hover:opacity-100 border border-gray-200"
            )}>
                <button
                    onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                    disabled={isFirst}
                    className="p-1 rounded hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Up"
                >
                    <ArrowUp size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                    disabled={isLast}
                    className="p-1 rounded hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Down"
                >
                    <ArrowDown size={14} />
                </button>

                {/* Reset Layout Button - Only show if modified */}
                {(scale !== 1 || x !== 0 || y !== 0) && (
                    <>
                        <div className="w-px h-3 bg-current opacity-20 mx-1"></div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onScaleChange) onScaleChange(1);
                                if (onPositionChange) onPositionChange(0, 0);
                            }}
                            className="p-1 rounded hover:bg-black/10 text-blue-600"
                            title="Reset Layout (Size & Position)"
                        >
                            <Settings size={14} className="rotate-45" /> {/* Temporary icon until we import RotateCcw */}
                        </button>
                    </>
                )}

                <div className="w-px h-3 bg-current opacity-20 mx-1"></div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1 rounded hover:bg-red-500 hover:text-white text-red-400"
                    title="Delete Section"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Scalable Content Container */}
            <div style={{
                transition: isResizing ? 'none' : 'transform 0.2s ease-out',
                // Zoom handles scaling layout
            }}>
                {children}
            </div>
        </div>
    );
};

export default VisualSectionWrapper;
