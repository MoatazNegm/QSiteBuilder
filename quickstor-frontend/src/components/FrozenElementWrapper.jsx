import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

const FrozenElementWrapper = ({
    element,
    pages = []
}) => {
    const navigate = useNavigate();
    const contentRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [naturalSize, setNaturalSize] = useState(null);

    // Render content and measure natural size
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.innerHTML = element.html;

            // Measure the natural (intrinsic) size after the HTML renders
            requestAnimationFrame(() => {
                if (contentRef.current) {
                    const rect = contentRef.current.getBoundingClientRect();
                    setNaturalSize({ width: rect.width, height: rect.height });
                }
            });
        }
    }, [element.html]);

    const handleLinkClick = (e) => {
        if (!element.link) return;

        // External link
        if (element.link.startsWith('http')) {
            window.location.href = element.link;
            return;
        }

        // Internal Page Link
        const targetPage = pages.find(p => p.id === element.link);
        if (targetPage) {
            const path = targetPage.slug === '/' ? '/' : `/${targetPage.slug.replace(/^\//, '')}`;
            navigate(path);
        } else {
            console.warn(`Linked page not found: ${element.link}`);
        }
    };

    const hasLink = !!element.link;

    // Compute content scaling (same logic as admin editor's VisualElementWrapper)
    // When user resizes an element, we scale the content visually using CSS transform
    const computeContentTransform = () => {
        if (!naturalSize ||
            !element.width || element.width === 'auto' ||
            !element.height || element.height === 'auto') {
            return { transform: 'none', width: 'auto', height: 'auto' };
        }
        const scaleX = element.width / naturalSize.width;
        const scaleY = element.height / naturalSize.height;
        return {
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'top left',
            width: naturalSize.width,
            height: naturalSize.height
        };
    };

    const contentStyle = computeContentTransform();

    return (
        <div
            className={cn(
                "absolute select-none",
                hasLink ? "cursor-pointer" : "pointer-events-none"
            )}
            style={{
                left: element.x,
                top: element.y,
                width: element.width || 'auto',
                height: element.height || 'auto',
                overflow: 'hidden',
                transform: `rotate(${element.rotation || 0}deg)`,
                zIndex: element.zIndex || 50
            }}
            onClick={hasLink ? handleLinkClick : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                ref={contentRef}
                style={{
                    ...contentStyle,
                    pointerEvents: hasLink ? 'auto' : 'none'
                }}
            />
        </div>
    );
};

export default FrozenElementWrapper;
