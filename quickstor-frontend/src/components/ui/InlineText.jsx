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
            elementRef.current.innerText = value || '';
        }
    }, [value]);

    const handleBlur = (e) => {
        const newValue = e.target.innerText;
        if (newValue !== value) {
            updateField(field, newValue);
        }
    };

    const handleKeyDown = (e) => {
        // Prevent creating new divs on Enter if we want strictly inline (optional, depends on use case)
        // For now, let's allow it but maybe block if it's a specific simple text field
    };

    if (!isEditable) {
        return <Component className={className} {...props}>{value}</Component>;
    }

    return (
        <Component
            ref={elementRef}
            contentEditable
            suppressContentEditableWarning
            className={`${className} outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-500/10 rounded px-1 transition-all cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500`}
            onBlur={handleBlur}
            // We don't use onChange for contentEditable, we read formatting on blur
            // But we can sync local state if needed
            data-placeholder={placeholder}
            data-field={field} // Helper for debugging
            {...props}
        >
            {value}
        </Component>
    );
};

export default InlineText;
