import React from 'react';
import { cn } from '../utils/cn';

const RenderSectionWrapper = ({ children, styles = {}, className }) => {
    const { scale = 1, position = { x: 0, y: 0 } } = styles;
    const { x, y } = position || { x: 0, y: 0 };

    // If no custom styles, just return children wrapped in a normal div for standard flow
    // But to match the editor's "inline-block" behavior for side-by-side:
    // We should always apply the basic structure if we want consistent behavior.

    // However, legacy/unaffected sections might look weird if force-wrapped in inline-block.
    // Let's apply it only if scale != 1 or position != 0 to be safe? 
    // No, user wants consistent alignment. Let's replicate VisualSectionWrapper structure.

    return (
        <div
            className={cn(
                "relative transition-all duration-200 mb-4 inline-block align-top vertical-align-top",
                "w-full max-w-full", // Default to full width behavior but allow shrinking via zoom
                className
            )}
            style={{
                zoom: scale,
                transform: `translate(${x}px, ${y}px)`,
                position: (x !== 0 || y !== 0) ? 'relative' : 'relative',
                width: 'auto', // Allow shrink
                maxWidth: '100%',
                zIndex: (x !== 0 || y !== 0) ? 10 : 1
            }}
        >
            {/* Inner container to ensure content flow */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default RenderSectionWrapper;
