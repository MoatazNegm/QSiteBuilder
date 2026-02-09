import React, { createContext, useContext, useCallback } from 'react';

const SectionEditorContext = createContext({
    isEditable: false,
    updateField: () => { },
    content: {}
});

export const useSectionEditor = () => useContext(SectionEditorContext);

export const SectionEditorProvider = ({
    children,
    isEditable = false,
    content,
    onUpdate,
    sectionId
}) => {

    const updateField = useCallback((path, value) => {
        if (!onUpdate) return;

        // Deep clone content to avoid mutation
        const newContent = JSON.parse(JSON.stringify(content));

        // Handle direct HTML text edits (from CustomHTMLSection)
        if (path.startsWith('_html_edit_') && typeof value === 'object') {
            // Replace text in the raw HTML
            if (newContent.html && value.original && value.updated) {
                // Escape special regex characters in the original text
                const escapedOriginal = value.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Replace only the first occurrence to avoid unintended changes
                newContent.html = newContent.html.replace(
                    new RegExp(escapedOriginal),
                    value.updated
                );
            }
            onUpdate(sectionId, newContent);
            return;
        }

        // Helper to set deep value for regular fields
        const setDeep = (obj, path, val) => {
            const keys = path.split('.');
            let current = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = val;
        };

        setDeep(newContent, path, value);
        onUpdate(sectionId, newContent);
    }, [content, onUpdate, sectionId]);

    return (
        <SectionEditorContext.Provider value={{ isEditable, updateField, content }}>
            {children}
        </SectionEditorContext.Provider>
    );
};
