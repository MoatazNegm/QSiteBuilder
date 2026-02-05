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

        // Helper to set deep value
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
