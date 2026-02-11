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

    // Render content
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.innerHTML = element.html;
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
                transform: `rotate(${element.rotation || 0}deg)`,
                zIndex: 50 // Ensure it's above sections
            }}
            onClick={hasLink ? handleLinkClick : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                ref={contentRef}
                style={{
                    width: '100%',
                    height: '100%',
                    pointerEvents: hasLink ? 'auto' : 'none' // Only catch clicks if linked
                }}
            />
        </div>
    );
};

export default FrozenElementWrapper;
