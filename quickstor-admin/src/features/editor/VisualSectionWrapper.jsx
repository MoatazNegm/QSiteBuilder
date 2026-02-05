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
    label
}) => {
    return (
        <div
            className={cn(
                "relative group transition-all duration-200",
                isSelected ? "ring-2 ring-blue-500 z-10" : "hover:ring-1 hover:ring-blue-300"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Selection Overlay (Click catcher) */}
            {!isSelected && (
                <div className="absolute inset-0 bg-transparent z-[5] cursor-pointer" />
            )}

            {/* Label Badge */}
            {(isSelected || true) && (
                <div className={cn(
                    "absolute left-0 bottom-full mb-0 z-20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-t-md flex items-center gap-2",
                    isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                )}>
                    {label || 'Section'}
                </div>
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
                <div className="w-px h-3 bg-current opacity-20 mx-1"></div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1 rounded hover:bg-red-500 hover:text-white text-red-400"
                    title="Delete Section"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {children}
        </div>
    );
};

export default VisualSectionWrapper;
