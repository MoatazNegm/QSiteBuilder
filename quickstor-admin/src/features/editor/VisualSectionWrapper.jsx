import React, { useRef, useState, useCallback } from 'react';
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
    onPositionChange,
    width,
    height,
    onSizeChange
}) => {
    const wrapperRef = useRef(null);
    const currentScaleRef = useRef(scale);
    currentScaleRef.current = scale;

    // --- Resize State ---
    const [isResizing, setIsResizing] = useState(false);
    const resizeModeRef = useRef(null);
    const resizeStart = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });
    const startScale = useRef(1);

    const handleResizeMove = useCallback((e) => {
        const mode = resizeModeRef.current;
        if (!mode) return;

        const zoomFactor = currentScaleRef.current || 1;
        const deltaX = (e.clientX - resizeStart.current.x) / zoomFactor;
        const deltaY = (e.clientY - resizeStart.current.y) / zoomFactor;

        if (mode === 'width') {
            const newWidth = Math.max(100, startSize.current.width + deltaX);
            if (onSizeChange) onSizeChange(Math.round(newWidth), startSize.current.height);
        } else if (mode === 'height') {
            const newHeight = Math.max(50, startSize.current.height + deltaY);
            if (onSizeChange) onSizeChange(startSize.current.width, Math.round(newHeight));
        } else if (mode === 'both') {
            const newScale = Math.max(0.5, Math.min(3, startScale.current + (deltaY * 0.004)));
            if (onScaleChange) onScaleChange(newScale);
        }
    }, [onSizeChange, onScaleChange]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        resizeModeRef.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }, [handleResizeMove]);

    const handleResizeStart = useCallback((mode) => (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        resizeModeRef.current = mode;
        resizeStart.current = { x: e.clientX, y: e.clientY };

        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const zoomFactor = currentScaleRef.current || 1;
            startSize.current = {
                width: width || Math.round(rect.width / zoomFactor),
                height: height || Math.round(rect.height / zoomFactor)
            };
        }
        startScale.current = scale || 1;

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }, [width, height, scale, handleResizeMove, handleResizeEnd]);

    // --- Drag Logic ---
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });

    const handleDragMove = useCallback((e) => {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        if (onPositionChange) onPositionChange(startPos.current.x + deltaX, startPos.current.y + deltaY);
    }, [onPositionChange]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
    }, [handleDragMove]);

    const handleDragStart = useCallback((e) => {
        e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        startPos.current = { x: x || 0, y: y || 0 };
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }, [x, y, handleDragMove, handleDragEnd]);

    const hasCustomSize = width || height;

    return (
        <div
            ref={wrapperRef}
            className={cn(
                "relative group transition-all duration-200 mb-4",
                isSelected ? "ring-2 ring-blue-500 z-10" : "hover:ring-1 hover:ring-blue-300"
            )}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            style={{
                zoom: scale,
                transform: `translate(${x}px, ${y}px)`,
                position: 'relative',
                zIndex: isDragging || isResizing ? 50 : (isSelected ? 40 : 1),
                width: width ? `${width}px` : '100%',
                height: height ? `${height}px` : 'auto',
                boxSizing: 'border-box'
            }}
        >
            {/* Selection Overlay */}
            {!isSelected && !isResizing && (
                <div className="absolute inset-0 bg-transparent z-[5] cursor-pointer" />
            )}

            {/* Top Label/Drag Handle */}
            <div
                className={cn(
                    "absolute left-0 bottom-full mb-0 z-20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-t-md flex items-center gap-2 select-none",
                    isSelected ? "bg-blue-500 text-white cursor-move" : "bg-gray-200 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                )}
                onMouseDown={isSelected ? handleDragStart : undefined}
                title={isSelected ? "Drag to Move" : ""}
                style={{ zoom: 1 / scale }}
            >
                {label || 'Section'}
                {scale !== 1 && <span className="opacity-75 text-[9px]">({Math.round(scale * 100)}%)</span>}
                {hasCustomSize && <span className="opacity-75 text-[9px]">[{width || 'auto'}×{height || 'auto'}]</span>}
            </div>

            {isSelected && (
                <div
                    className="absolute top-1/2 -left-3 -translate-y-1/2 w-3 h-12 z-25 cursor-move flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-l-md"
                    onMouseDown={handleDragStart}
                    title="Drag to move"
                    style={{ zoom: 1 / scale }}
                >
                    <div className="w-0.5 h-6 bg-white/60 rounded-full" />
                </div>
            )}

            {/* RIGHT SIDE - Blue Move Handle (top portion) + Green Resize Handle (bottom portion) */}
            {isSelected && (
                <>
                    {/* Blue Move Handle - Right Top */}
                    <div
                        className="absolute top-0 -right-3 w-3 h-1/3 z-30 cursor-move flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-tr-md"
                        onMouseDown={handleDragStart}
                        title="Drag to move"
                        style={{ zoom: 1 / scale }}
                    >
                        <div className="w-0.5 h-4 bg-white/60 rounded-full" />
                    </div>
                    {/* Green Resize Handle - Right Bottom */}
                    <div
                        className="absolute top-1/3 -right-3 w-3 h-2/3 z-30 cursor-ew-resize flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-br-md"
                        onMouseDown={handleResizeStart('width')}
                        title="Resize width"
                        style={{ zoom: 1 / scale }}
                    >
                        <div className="w-0.5 h-8 bg-white/70 rounded-full" />
                    </div>
                </>
            )}

            {/* BOTTOM - Blue Move Handle (left portion) + Green Resize Handle (right portion) */}
            {isSelected && (
                <>
                    {/* Blue Move Handle - Bottom Left */}
                    <div
                        className="absolute left-0 -bottom-3 w-1/3 h-3 z-30 cursor-move flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-bl-md"
                        onMouseDown={handleDragStart}
                        title="Drag to move"
                        style={{ zoom: 1 / scale }}
                    >
                        <div className="h-0.5 w-4 bg-white/60 rounded-full" />
                    </div>
                    {/* Green Resize Handle - Bottom Right */}
                    <div
                        className="absolute left-1/3 -bottom-3 w-2/3 h-3 z-30 cursor-ns-resize flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-br-md"
                        onMouseDown={handleResizeStart('height')}
                        title="Resize height"
                        style={{ zoom: 1 / scale }}
                    >
                        <div className="h-0.5 w-8 bg-white/70 rounded-full" />
                    </div>
                </>
            )}

            {/* CORNER Scale Handle (Orange) */}
            {isSelected && (
                <div
                    className="absolute -bottom-3 -right-3 w-5 h-5 bg-orange-500 border border-white shadow-md rounded z-40 cursor-se-resize flex items-center justify-center hover:scale-110 transition-transform"
                    onMouseDown={handleResizeStart('both')}
                    title="Scale proportionally"
                    style={{ zoom: 1 / scale }}
                >
                    <div className="w-2 h-2 bg-white rounded-full pointer-events-none" />
                </div>
            )}

            {/* Action Toolbar */}
            <div
                className={cn(
                    "absolute right-2 top-2 z-20 flex items-center gap-1 p-1 rounded-md shadow-sm transition-opacity",
                    isSelected ? "bg-blue-500 text-white opacity-100" : "bg-white text-gray-600 opacity-0 group-hover:opacity-100 border border-gray-200"
                )}
                style={{ zoom: 1 / scale }}
            >
                <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className="p-1 rounded hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed" title="Move Up">
                    <ArrowUp size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className="p-1 rounded hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed" title="Move Down">
                    <ArrowDown size={14} />
                </button>
                {(scale !== 1 || x !== 0 || y !== 0 || hasCustomSize) && (
                    <>
                        <div className="w-px h-3 bg-current opacity-20 mx-1" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onScaleChange) onScaleChange(1);
                                if (onPositionChange) onPositionChange(0, 0);
                                if (onSizeChange) onSizeChange(null, null);
                            }}
                            className="p-1 rounded hover:bg-black/10 text-blue-200"
                            title="Reset Layout"
                        >
                            <Settings size={14} className="rotate-45" />
                        </button>
                    </>
                )}
                <div className="w-px h-3 bg-current opacity-20 mx-1" />
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-red-500 hover:text-white text-red-300" title="Delete Section">
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Content */}
            <div style={{ transition: isResizing ? 'none' : 'all 0.2s ease-out', width: '100%', height: height ? '100%' : 'auto', overflow: hasCustomSize ? 'hidden' : 'visible' }}>
                {children}
            </div>
        </div>
    );
};

export default VisualSectionWrapper;
