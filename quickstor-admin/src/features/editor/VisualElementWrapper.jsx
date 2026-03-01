import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Trash2, GripVertical, Link, ExternalLink, RotateCw } from 'lucide-react';
import { cn } from '../../utils/cn';

const VisualElementWrapper = ({
    children,
    element,
    isSelected,
    onSelect,
    onChange,
    onDelete,
    scale = 1,
    pages = []
}) => {
    const wrapperRef = useRef(null);
    const contentRef = useRef(null);

    // Local state for smooth dragging/resizing
    const [position, setPosition] = useState({ x: element.x || 0, y: element.y || 0 });
    const [size, setSize] = useState({ width: element.width, height: element.height });
    const [rotation, setRotation] = useState(element.rotation || 0);

    // Refs that always point to the LATEST state — used by event handlers
    // to avoid stale closures when mouseup fires after the handler was attached at mousedown.
    const positionRef = useRef(position);
    const sizeRef = useRef(size);
    const rotationRef = useRef(rotation);
    const elementRef = useRef(element);
    useEffect(() => { positionRef.current = position; }, [position]);
    useEffect(() => { sizeRef.current = size; }, [size]);
    useEffect(() => { rotationRef.current = rotation; }, [rotation]);
    useEffect(() => { elementRef.current = element; }, [element]);
    const [isDoomed, setIsDoomed] = useState(false); // For delete animation
    const [isEditing, setIsEditing] = useState(false); // For inline text editing
    const [showLinkPanel, setShowLinkPanel] = useState(false);
    const [linkValue, setLinkValue] = useState(element.link || '');

    // Track the natural (original) size of the content for scaling
    const naturalSizeRef = useRef(null);

    // Capture natural size on first render
    useEffect(() => {
        if (contentRef.current && !naturalSizeRef.current) {
            // Wait a tick for the HTML to render
            requestAnimationFrame(() => {
                if (contentRef.current) {
                    const rect = contentRef.current.getBoundingClientRect();
                    naturalSizeRef.current = { width: rect.width, height: rect.height };
                }
            });
        }
    }, []);

    // Control innerHTML via ref — only update when NOT editing
    // This prevents React from resetting contentEditable changes
    useEffect(() => {
        if (!isEditing && contentRef.current) {
            contentRef.current.innerHTML = element.html;
        }
    }, [element.html, isEditing]);

    // Sync with props when not interacting
    useEffect(() => {
        if (!isDragging && !isResizing && !isRotating) {
            setPosition({ x: element.x || 0, y: element.y || 0 });
            setSize({ width: element.width, height: element.height });
            setRotation(element.rotation || 0);
        }
    }, [element.x, element.y, element.width, element.height, element.rotation]);

    // --- Interaction State ---
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);

    const dragStartRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef({ x: 0, y: 0 });
    const startSizeRef = useRef({ width: 0, height: 0 });
    const resizeModeRef = useRef(null);

    // --- Drag Logic ---
    const handleDragStart = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startPosRef.current = { x: position.x, y: position.y };
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }, [position, onSelect]);

    const handleDragMove = useCallback((e) => {
        const zoomFactor = scale || 1;
        const deltaX = (e.clientX - dragStartRef.current.x) / zoomFactor;
        const deltaY = (e.clientY - dragStartRef.current.y) / zoomFactor;
        setPosition({
            x: startPosRef.current.x + deltaX,
            y: startPosRef.current.y + deltaY
        });
    }, [scale]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        // Use refs to read the LATEST values, not the stale closure-captured ones
        onChange({ ...elementRef.current, x: positionRef.current.x, y: positionRef.current.y });
    }, [onChange]);

    // --- Resize Logic ---
    const handleResizeStart = useCallback((mode) => (e) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect();
        setIsResizing(true);
        resizeModeRef.current = mode;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startPosRef.current = { x: position.x, y: position.y };

        // If size is auto, get computed size and store as natural size
        if (!size.width || size.width === 'auto' || !size.height || size.height === 'auto') {
            const rect = wrapperRef.current.getBoundingClientRect();
            const computedW = rect.width / scale;
            const computedH = rect.height / scale;
            startSizeRef.current = { width: computedW, height: computedH };
            // Also set as natural size if not yet captured
            if (!naturalSizeRef.current) {
                naturalSizeRef.current = { width: computedW, height: computedH };
            }
        } else {
            startSizeRef.current = { width: size.width, height: size.height };
        }

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }, [position, size, scale, onSelect]);

    const handleResizeMove = useCallback((e) => {
        const zoomFactor = scale || 1;
        const deltaX = (e.clientX - dragStartRef.current.x) / zoomFactor;
        const deltaY = (e.clientY - dragStartRef.current.y) / zoomFactor;

        let newWidth = startSizeRef.current.width;
        let newHeight = startSizeRef.current.height;
        let newX = startPosRef.current.x;
        let newY = startPosRef.current.y;
        const mode = resizeModeRef.current;

        if (mode.includes('e')) newWidth += deltaX;
        if (mode.includes('w')) { newWidth -= deltaX; newX += deltaX; }
        if (mode.includes('s')) newHeight += deltaY;
        if (mode.includes('n')) { newHeight -= deltaY; newY += deltaY; }

        if (newWidth < 20) newWidth = 20;
        if (newHeight < 20) newHeight = 20;

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
    }, [scale]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        resizeModeRef.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        // Use refs to read the LATEST values, not the stale closure-captured ones
        onChange({
            ...elementRef.current,
            x: positionRef.current.x, y: positionRef.current.y,
            width: sizeRef.current.width, height: sizeRef.current.height,
            rotation: rotationRef.current
        });
    }, [onChange]);

    // --- Rotation Logic ---
    const handleRotateStart = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect();
        setIsRotating(true);

        // Calculate center of element
        const rect = wrapperRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        startPosRef.current = { x: centerX, y: centerY };

        document.addEventListener('mousemove', handleRotateMove);
        document.addEventListener('mouseup', handleRotateEnd);
    }, [onSelect]);

    const handleRotateMove = useCallback((e) => {
        const centerX = startPosRef.current.x;
        const centerY = startPosRef.current.y;

        // Calculate angle
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        // Adjust angle so 0 is top (currently 0 is right)
        angle += 90;

        // Snap to 15 degrees if Shift is held
        if (e.shiftKey) {
            angle = Math.round(angle / 15) * 15;
        }

        setRotation(angle);
    }, []);

    const handleRotateEnd = useCallback(() => {
        setIsRotating(false);
        document.removeEventListener('mousemove', handleRotateMove);
        document.removeEventListener('mouseup', handleRotateEnd);
        // Use ref to read the LATEST rotation value
        onChange({ ...elementRef.current, rotation: rotationRef.current });
    }, [onChange]);

    const handleDelete = (e) => {
        e.stopPropagation();
        if (confirm('Delete this element?')) {
            setIsDoomed(true);
            setTimeout(() => onDelete(element.id), 200);
        }
    };

    // --- Double-click to edit text ---
    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        setIsEditing(true);
        onSelect();
        // After state update, focus the content
        requestAnimationFrame(() => {
            if (contentRef.current) {
                contentRef.current.focus();
            }
        });
    }, [onSelect]);

    const handleEditBlur = useCallback(() => {
        setIsEditing(false);
        if (contentRef.current) {
            const newHtml = contentRef.current.innerHTML;
            onChange({ ...element, html: newHtml });
        }
    }, [element, onChange]);

    const handleEditKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setIsEditing(false);
            if (contentRef.current) {
                const newHtml = contentRef.current.innerHTML;
                onChange({ ...element, html: newHtml });
            }
        }
    }, [element, onChange]);

    // Compute content scale: when user resizes, scale the content visually
    // instead of trying to override the element's CSS classes
    const computeContentTransform = () => {
        const ns = naturalSizeRef.current;
        if (!ns || !size.width || size.width === 'auto' || !size.height || size.height === 'auto') {
            return { transform: 'none', width: 'auto', height: 'auto' };
        }
        const scaleX = size.width / ns.width;
        const scaleY = size.height / ns.height;
        return {
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'top left',
            width: ns.width,
            height: ns.height
        };
    };

    const contentStyle = computeContentTransform();

    return (
        <div
            ref={wrapperRef}
            className={cn(
                "absolute group select-none",
                isDoomed && "scale-0 opacity-0 transition-all duration-200"
            )}
            style={{
                left: position.x,
                top: position.y,
                width: size.width || 'auto',
                height: size.height || 'auto',
                overflow: 'visible',
                transform: `rotate(${rotation}deg)`,
                zIndex: (isDragging || isResizing || isRotating) ? (element.zIndex || 50) + 100 : (element.zIndex || 50)
            }}
            data-wrapper="true"
            data-id={element.id}
            data-element-name={element.name || element.type || 'Custom Element'}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Content */}
            <div
                className={cn(
                    "relative",
                    isSelected ? "ring-2 ring-blue-500 ring-offset-2" : "group-hover:ring-1 group-hover:ring-blue-300 group-hover:ring-offset-1"
                )}
                style={{
                    width: size.width || 'auto',
                    height: size.height || 'auto',
                    overflow: 'hidden'
                }}
            >
                {/* Render HTML Content - use transform scaling */}
                <div
                    ref={contentRef}
                    data-content="true"
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={isEditing ? handleEditBlur : undefined}
                    onKeyDown={isEditing ? handleEditKeyDown : undefined}
                    style={{
                        pointerEvents: isEditing ? 'auto' : 'none',
                        outline: isEditing ? '2px solid #3b82f6' : 'none',
                        outlineOffset: '2px',
                        cursor: isEditing ? 'text' : 'default',
                        ...contentStyle
                    }}
                />

                {/* Click capture overlay — hidden during editing */}
                {!isEditing && <div className="absolute inset-0 bg-transparent" onDoubleClick={handleDoubleClick} />}
            </div>

            {/* --- Controls --- */}

            {/* Top Toolbar (Move + Layering + Delete) */}
            {isSelected && (
                <div
                    className="absolute -top-8 left-0 flex items-center bg-white border border-gray-200 rounded-md shadow-sm z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    data-no-style="true"
                >
                    <div
                        className="px-2 py-1 flex items-center gap-1 cursor-grab active:cursor-grabbing hover:bg-gray-50 text-gray-700 text-xs border-r border-gray-200"
                        onMouseDown={handleDragStart}
                        title="Move Element"
                    >
                        <GripVertical size={14} className="text-gray-400" />
                        <span className="font-semibold px-1">Move</span>
                    </div>

                    <div className="flex items-center">
                        <button
                            onClick={() => onChange({ ...element, zIndex: (element.zIndex || 50) + 1 })}
                            className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors border-r border-gray-200"
                            title="Bring Forward (Z-Index +1)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 19 12 5 5 12 12 5 19 12" /></svg>
                        </button>
                        <div className="px-1.5 text-[10px] font-mono text-gray-400 border-r border-gray-200 bg-gray-50 flex items-center justify-center min-w-[28px]">
                            {element.zIndex || 50}
                        </div>
                        <button
                            onClick={() => onChange({ ...element, zIndex: Math.max(0, (element.zIndex || 50) - 1) })}
                            className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors border-r border-gray-200"
                            title="Send Backward (Z-Index -1)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 5 12 19 19 12 12 19 5 12" /></svg>
                        </button>
                    </div>

                    <button
                        className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                        onClick={handleDelete}
                        title="Delete Element"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {/* Move Handle (Top Left - Fallback for unselected hover) */}
            {!isSelected && !isDragging && !isRotating && (
                <div
                    className="absolute -top-6 left-0 bg-blue-500 text-white rounded px-1.5 py-0.5 text-xs flex items-center gap-1 cursor-grab active:cursor-grabbing shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={handleDragStart}
                    data-no-style="true"
                >
                    <GripVertical size={12} />
                    <span className="font-bold">Move</span>
                </div>
            )}

            {/* Rotation Handle (Top Center Stick) */}
            {isSelected && (
                <div
                    className="absolute -top-[3.5rem] left-1/2 -translate-x-1/2 flex flex-col items-center group/rotate z-40"
                    onMouseDown={handleRotateStart}
                    data-no-style="true"
                >
                    <div className="w-5 h-5 bg-white border border-blue-500 text-blue-500 rounded-full flex items-center justify-center cursor-crosshair shadow-sm hover:bg-blue-50">
                        <RotateCw size={10} />
                    </div>
                    <div className="w-px h-3 bg-blue-500"></div>
                </div>
            )}

            {/* Resize Handles (8 points) */}
            {isSelected && !isDragging && !isRotating && (
                <>
                    {/* Corners */}
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full cursor-nw-resize z-10" onMouseDown={handleResizeStart('nw')} data-no-style="true" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full cursor-ne-resize z-10" onMouseDown={handleResizeStart('ne')} data-no-style="true" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full cursor-sw-resize z-10" onMouseDown={handleResizeStart('sw')} data-no-style="true" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full cursor-se-resize z-10" onMouseDown={handleResizeStart('se')} data-no-style="true" />

                    {/* Sides */}
                    <div className="absolute top-1/2 -left-1 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full cursor-w-resize -translate-y-1/2 z-10" onMouseDown={handleResizeStart('w')} data-no-style="true" />
                    <div className="absolute top-1/2 -right-1 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full cursor-e-resize -translate-y-1/2 z-10" onMouseDown={handleResizeStart('e')} data-no-style="true" />
                    <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full cursor-n-resize -translate-x-1/2 z-10" onMouseDown={handleResizeStart('n')} data-no-style="true" />
                    <div className="absolute -bottom-1 left-1/2 w-2.5 h-2.5 bg-white border border-blue-500 rounded-full cursor-s-resize -translate-x-1/2 z-10" onMouseDown={handleResizeStart('s')} data-no-style="true" />
                </>
            )}

            {/* Link Indicator Badge */}
            {element.link && !isSelected && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-[9px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm whitespace-nowrap">
                    <Link size={8} />
                    {element.link.startsWith('http') ? 'URL' : element.link}
                </div>
            )}

            {/* Link Button (Bottom) */}
            {isSelected && (
                <div
                    className={cn(
                        "absolute -bottom-7 left-0 flex items-center gap-1 transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0"
                    )}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowLinkPanel(!showLinkPanel); }}
                        className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium shadow-sm transition-colors",
                            element.link
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        )}
                        title="Set Link"
                    >
                        <Link size={10} />
                        {element.link ? 'Linked' : 'Add Link'}
                    </button>
                </div>
            )}

            {/* Link Panel */}
            {isSelected && showLinkPanel && (
                <div
                    className="absolute -bottom-[6.5rem] left-0 bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl z-[60] w-56"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-[10px] text-gray-400 font-medium mb-1.5 flex items-center gap-1">
                        <Link size={10} className="text-blue-400" />
                        Link Destination
                    </div>
                    <select
                        value={linkValue.startsWith('http') || linkValue === '' ? '__custom__' : linkValue}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                                setLinkValue('');
                                onChange({ ...element, link: '' });
                            } else if (val === '__none__') {
                                setLinkValue('');
                                onChange({ ...element, link: '' });
                            } else {
                                setLinkValue(val);
                                onChange({ ...element, link: val });
                            }
                        }}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-[11px] mb-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="__none__">— No Link —</option>
                        <option value="__custom__">Custom URL...</option>
                        {pages.map(p => (
                            <option key={p.id} value={p.id}>
                                📄 {p.title || p.name || p.id}
                            </option>
                        ))}
                    </select>
                    {(linkValue.startsWith('http') || linkValue === '' || !pages.find(p => p.id === linkValue)) && (
                        <div className="flex items-center gap-1">
                            <ExternalLink size={10} className="text-gray-500 shrink-0" />
                            <input
                                type="text"
                                placeholder="https://example.com"
                                value={linkValue.startsWith('http') || !pages.find(p => p.id === linkValue) ? linkValue : ''}
                                onChange={(e) => {
                                    setLinkValue(e.target.value);
                                    onChange({ ...element, link: e.target.value });
                                }}
                                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-[11px] outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    )}
                    {element.link && (
                        <button
                            onClick={() => {
                                setLinkValue('');
                                onChange({ ...element, link: '' });
                            }}
                            className="w-full mt-1.5 text-[10px] text-red-400 hover:text-red-300 py-0.5 text-center"
                        >
                            Remove Link
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default VisualElementWrapper;
