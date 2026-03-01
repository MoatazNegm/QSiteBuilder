import React from 'react';
import { cn } from '../utils/cn';

const RenderSectionWrapper = ({ children, styles = {}, className, width, height }) => {
    const { scale = 1, position = { x: 0, y: 0 } } = styles;
    const { x, y } = position || { x: 0, y: 0 };

    return (
        <div
            className={cn(
                "relative transition-all duration-200 mb-4",
                className
            )}
            style={{
                zoom: scale,
                transform: `translate(${x}px, ${y}px)`,
                position: 'relative',
                width: width ? `${width}px` : '100%',
                height: height ? `${height}px` : 'auto',
                boxSizing: 'border-box',
                zIndex: (x !== 0 || y !== 0) ? 10 : 1
            }}
        >
            <div style={{ width: '100%', height: height ? '100%' : 'auto' }}>
                {children}
            </div>
        </div>
    );
};

export default RenderSectionWrapper;
