import React, { useState, useEffect, useRef } from 'react';
import { useSectionEditor } from '../../contexts/SectionEditorContext';

const InlineText = ({
    field,
    value,
    as: Component = 'span',
    className,
    placeholder = 'Type here...',
    ...props
}) => {
    const { isEditable, updateField } = useSectionEditor();
    const [localValue, setLocalValue] = useState(value || '');
    const elementRef = useRef(null);

    // Sync with prop changes
    useEffect(() => {
        setLocalValue(value || '');
        if (elementRef.current && document.activeElement !== elementRef.current) {
            elementRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleBlur = (e) => {
        const newValue = e.target.innerHTML;
        if (newValue !== value) {
            updateField(field, newValue);
        }
    };

    const handleKeyDown = (e) => {
        // Prevent creating new divs on Enter if we want strictly inline (optional, depends on use case)
        if (e.key === 'Enter') {
            document.execCommand('insertLineBreak');
            e.preventDefault();
        }
    };

    if (!isEditable) {
        return <Component className={className} dangerouslySetInnerHTML={{ __html: value || '' }} {...props} />;
    }

    return (
        <Component
            ref={elementRef}
            contentEditable
            suppressContentEditableWarning
            className={`${className} outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-500/10 rounded px-1 transition-all cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500`}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            // We don't use onChange for contentEditable, we read formatting on blur
            // But we can sync local state if needed
            data-placeholder={placeholder}
            data-field={field} // Helper for debugging
            {...props}
        >
            {/* Initial content set via useEffect to avoid re-render issues with focus */}
        </Component>
    );
};

export default InlineText;
