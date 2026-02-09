import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Paintbrush } from 'lucide-react';
import { useContentStore } from '../../hooks/useContentStore';

// Import Data Source for static elements (Navbar/Footer)
import { defaultContent } from '../../../../quickstor-frontend/src/data/defaultContent';
import { applyThemeToDocument } from '../../../../quickstor-frontend/src/utils/themeUtils';

// Importing components directly from the frontend project
import Hero from '../../../../quickstor-frontend/src/components/Hero';
import ComparisonGraph from '../../../../quickstor-frontend/src/components/ComparisonGraph';
import FeatureGrid from '../../../../quickstor-frontend/src/components/FeatureGrid';
import Navbar from '../../../../quickstor-frontend/src/components/Navbar';
import Footer from '../../../../quickstor-frontend/src/components/Footer';
import { SectionEditorProvider } from '../../../../quickstor-frontend/src/contexts/SectionEditorContext';
import CustomHTMLSection from '../../components/CustomHTMLSection';
import ElementStyleEditor from '../../components/ui/ElementStyleEditor';

// In case the frontend doesn't export a SectionRenderer, we map it locally
const COMPONENT_MAP = {
  'HERO': Hero,
  'COMPARISON_GRAPH': ComparisonGraph,
  'FEATURE_GRID': FeatureGrid,
  'CUSTOM_HTML': CustomHTMLSection,
};

import VisualSectionWrapper from './VisualSectionWrapper';
import FontLoader from '../../../../quickstor-frontend/src/components/FontLoader';

const LivePreview = () => {
  const previewRef = useRef(null);
  const {
    sections,
    activePage,
    navbar,
    footer,
    setActivePageId,
    selectedSectionId,
    setSelectedSectionId,
    deleteSection,
    reorderSections,
    updateSection,
    activeTheme,
    resetPageLayout
  } = useContentStore();

  // --- Style Editor Mode ---
  const [styleEditorEnabled, setStyleEditorEnabled] = useState(false);
  const [styleEditorTarget, setStyleEditorTarget] = useState(null);
  const [styleEditorPosition, setStyleEditorPosition] = useState({ x: 100, y: 100 });
  const hoveredElementRef = useRef(null);

  // Helper: Check if element is a meaningful stylable element
  const isStylableElement = useCallback((target) => {
    if (!target || target === previewRef.current) return false;
    // Exclude the main preview container itself and very high-level wrappers
    if (target.classList?.contains('isolate')) return false;

    const tagName = target.tagName;
    // Exclude scripts, styles, meta elements, and UI overlays
    if (['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'HTML', 'BODY', 'SVG', 'PATH'].includes(tagName)) return false;

    // Prefer elements that are meaningful containers or have visible content
    // Check for section-level elements, containers with content, or text elements
    const isSectionElement = target.closest('[class*="section"]') === target ||
      target.closest('[class*="container"]') === target ||
      target.closest('[class*="wrapper"]') === target;
    const isContentElement = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'IMG', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'ASIDE', 'LI', 'UL', 'OL', 'LABEL'].includes(tagName);
    const hasDataAttribute = target.hasAttribute('data-field') || target.hasAttribute('data-section-id') || target.hasAttribute('data-edit-id');
    const hasVisibleSize = target.offsetWidth >= 20 && target.offsetHeight >= 20;

    return (isContentElement || isSectionElement || hasDataAttribute) && hasVisibleSize;
  }, []);

  // Toggle style mode with 'S' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
        return;
      }
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setStyleEditorEnabled(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hover handlers for style mode
  const handlePreviewMouseOver = useCallback((e) => {
    if (!styleEditorEnabled) return;
    const target = e.target;
    if (isStylableElement(target)) {
      target.style.outline = '2px solid rgba(59, 130, 246, 0.7)';
      target.style.outlineOffset = '2px';
      target.style.cursor = 'pointer';
      hoveredElementRef.current = target;
    }
  }, [styleEditorEnabled, isStylableElement]);

  const handlePreviewMouseOut = useCallback((e) => {
    if (!styleEditorEnabled) return;
    const target = e.target;
    if (isStylableElement(target)) {
      target.style.outline = '';
      target.style.outlineOffset = '';
      target.style.cursor = '';
      if (hoveredElementRef.current === target) {
        hoveredElementRef.current = null;
      }
    }
  }, [styleEditorEnabled, isStylableElement]);

  const handlePreviewClick = useCallback((e) => {
    if (!styleEditorEnabled) return;
    const target = e.target;

    // Find closest text element
    let el = target;
    while (el && el !== previewRef.current && !isStylableElement(el)) {
      el = el.parentElement;
    }

    if (el && el !== previewRef.current && isStylableElement(el)) {
      e.preventDefault();
      e.stopPropagation();

      // Assign a temporary edit ID if not present
      if (!el.getAttribute('data-field') && !el.getAttribute('data-edit-id')) {
        const uniqueId = `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        el.setAttribute('data-edit-id', uniqueId);
        el.setAttribute('data-original-text', el.innerText);
      }

      const rect = el.getBoundingClientRect();
      setStyleEditorPosition({ x: rect.right + 10, y: rect.top });
      setStyleEditorTarget(el);
    }
  }, [styleEditorEnabled, isStylableElement]);

  // Handle style updates from the editor
  const handleStyleUpdate = useCallback((newStyles) => {
    if (!styleEditorTarget) return;
    const el = styleEditorTarget;

    // Use setProperty with 'important' to override CSS specificity issues
    // especially for AI-generated sections with inline styles

    if (newStyles.color) {
      el.style.setProperty('color', newStyles.color, 'important');
    }

    if (newStyles.backgroundColor) {
      el.style.setProperty('background-color', newStyles.backgroundColor, 'important');
      el.style.setProperty('background', newStyles.backgroundColor, 'important'); // Also set background shorthand
    } else {
      el.style.removeProperty('background-color');
      el.style.removeProperty('background');
    }

    // Opacity
    if (newStyles.opacity !== undefined && newStyles.opacity !== null) {
      el.style.setProperty('opacity', (newStyles.opacity / 100).toString(), 'important');
    }

    if (newStyles.borderWidth && parseInt(newStyles.borderWidth) > 0) {
      el.style.setProperty('border', `${newStyles.borderWidth}px solid ${newStyles.borderColor || '#000'}`, 'important');
    } else {
      el.style.removeProperty('border');
    }

    if (newStyles.borderRadius && parseInt(newStyles.borderRadius) > 0) {
      el.style.setProperty('border-radius', `${newStyles.borderRadius}px`, 'important');
    } else {
      el.style.removeProperty('border-radius');
    }

    if (newStyles.fontSize) {
      el.style.setProperty('font-size', `${newStyles.fontSize}px`, 'important');
    }
    if (newStyles.fontWeight) {
      el.style.setProperty('font-weight', newStyles.fontWeight, 'important');
    }
    if (newStyles.fontFamily && newStyles.fontFamily !== 'inherit') {
      el.style.setProperty('font-family', newStyles.fontFamily, 'important');
    }

    // Force a repaint by reading a layout property
    void el.offsetHeight;
  }, [styleEditorTarget]);

  const handleTextUpdate = useCallback((newText) => {
    if (!styleEditorTarget) return;
    if (styleEditorTarget.innerText !== newText) {
      styleEditorTarget.innerText = newText;
    }
  }, [styleEditorTarget]);

  // Apply theme to the preview container whenever it changes
  useEffect(() => {
    if (previewRef.current && activeTheme) {
      applyThemeToDocument(activeTheme, previewRef.current);
    }
  }, [activeTheme]);

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    reorderSections(newSections);
  };

  const handleMoveDown = (index) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
    reorderSections(newSections);
  };

  return (
    <div className="flex-1 bg-gray-100 flex flex-col h-full overflow-hidden relative">
      {/* Simulation of a Browser Window */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-400 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            quickstor.com (Preview)
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Style Mode Toggle */}
          <button
            onClick={() => setStyleEditorEnabled(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded-md transition-all shadow-sm group ${styleEditorEnabled
              ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
              : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 border-gray-200 hover:border-blue-300'
              }`}
            title="Style Mode: Click elements in the preview to edit their colors, fonts, and spacing. Press 'S' to toggle."
          >
            <Paintbrush size={13} className={styleEditorEnabled ? 'text-white' : 'text-blue-500'} />
            <span>Style Mode</span>
            <span className="text-[10px] opacity-60 ml-1">(S)</span>
          </button>

          <div className="w-px h-5 bg-gray-200" />

          {/* Reset Page Layout */}
          <button
            onClick={() => {
              if (confirm('Reset layout for all sections on this page? This will reset scale to 100% and position to original.')) {
                resetPageLayout(activePage?.id || activePageId);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-md transition-all shadow-sm group"
            title="Reset all sections to their original size, scale, and position. Useful for starting fresh."
          >
            <Settings size={13} className="group-hover:rotate-180 transition-transform duration-500" />
            <span>Reset Page Layout</span>
          </button>
        </div>
      </div>

      {/* The actual website iframe/container */}
      <div className="flex-1 relative w-full h-full" style={{ transform: 'translate(0)' }}>
        <div
          ref={previewRef}
          className="absolute inset-0 overflow-y-auto bg-theme-background transition-colors duration-300"
          style={activePage?.styles ? {
            backgroundColor: activePage.styles.backgroundColor,
            color: activePage.styles.color,
            ...activePage.styles
          } : {}}
          onMouseOverCapture={handlePreviewMouseOver}
          onMouseOutCapture={handlePreviewMouseOut}
          onClickCapture={handlePreviewClick}
        >
          <div className="min-h-full isolate">
            {/* Navbar will now be fixed relative to the preview window */}
            <Navbar
              {...navbar}
              onLogoClick={() => setActivePageId('home')}
            />

            <div className="flex flex-wrap items-start content-start">
              {sections.map((section, index) => {
                const Component = COMPONENT_MAP[section.type];
                if (!Component) return <div key={section.id} className="p-4 text-red-500">Unknown Component: {section.type}</div>;

                return (
                  <VisualSectionWrapper
                    key={section.id}
                    isSelected={selectedSectionId === section.id}
                    onSelect={() => setSelectedSectionId(section.id)}
                    onDelete={() => deleteSection(section.id)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    isFirst={index === 0}
                    isLast={index === sections.length - 1}
                    label={section.type}
                    scale={section.content?.styles?.scale || 1}
                    onScaleChange={(newScale) => {
                      updateSection(section.id, {
                        ...section.content,
                        styles: {
                          ...section.content.styles,
                          scale: newScale
                        }
                      });
                    }}
                    x={section.content?.styles?.position?.x || 0}
                    y={section.content?.styles?.position?.y || 0}
                    onPositionChange={(newX, newY) => {
                      updateSection(section.id, {
                        ...section.content,
                        styles: {
                          ...section.content.styles,
                          position: { x: newX, y: newY }
                        }
                      });
                    }}
                    width={section.content?.styles?.width || null}
                    height={section.content?.styles?.height || null}
                    onSizeChange={(newWidth, newHeight) => {
                      updateSection(section.id, {
                        ...section.content,
                        styles: {
                          ...section.content.styles,
                          width: newWidth,
                          height: newHeight
                        }
                      });
                    }}
                  >
                    <SectionEditorProvider
                      sectionId={section.id}
                      content={section.content}
                      onUpdate={updateSection} // Function from useContentStore
                      isEditable={true}
                    >
                      <Component {...section.content} />
                    </SectionEditorProvider>
                  </VisualSectionWrapper>
                );
              })}
            </div>

            <Footer {...footer} />
          </div>
        </div>
      </div>

      {/* Floating Style Editor (Rendered via Portal) */}
      {styleEditorTarget && (
        <ElementStyleEditor
          element={styleEditorTarget}
          position={styleEditorPosition}
          onClose={() => setStyleEditorTarget(null)}
          onUpdate={handleStyleUpdate}
          onTextUpdate={handleTextUpdate}
        />
      )}
    </div>
  );
};

export default LivePreview;