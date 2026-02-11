import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Paintbrush, Layers, Undo2, Redo2 } from 'lucide-react';
import ElementLibrary from './ElementLibrary';
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
import VisualElementWrapper from './VisualElementWrapper';
import FontLoader from '../../../../quickstor-frontend/src/components/FontLoader';

const LivePreview = ({ isFullscreen }) => {
  const previewRef = useRef(null);
  const {
    sections,
    activePage,
    pages,
    navbar,
    footer,
    setActivePageId,
    selectedSectionId,
    setSelectedSectionId,
    deleteSection,
    reorderSections,
    updateSection,
    activeTheme,
    resetPageLayout,
    addElement,
    updateElement,
    deleteElement
  } = useContentStore();

  // Selected element ID for wrapper controls
  const [selectedElementId, setSelectedElementId] = useState(null);

  // --- Style Editor Mode ---
  const [styleEditorEnabled, setStyleEditorEnabled] = useState(false);
  const [styleEditorTarget, setStyleEditorTarget] = useState(null);
  const [styleEditorPosition, setStyleEditorPosition] = useState({ x: 100, y: 100 });
  const hoveredElementRef = useRef(null);

  // Close Element Library when exiting fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setElementLibraryOpen(false);
    }
  }, [isFullscreen]);

  // --- Element Library ---
  const [elementLibraryOpen, setElementLibraryOpen] = useState(false);

  // --- Global Undo/Redo History (all elements) ---
  const MAX_GLOBAL_HISTORY = 10;
  const globalHistoryRef = useRef({ past: [], future: [] });
  const [globalHistoryVersion, setGlobalHistoryVersion] = useState(0);

  const globalSnapshot = useCallback((el) => {
    if (!el) return;
    const history = globalHistoryRef.current;
    history.past.push({
      element: el,
      cssText: el.style.cssText,
      innerHTML: el.innerHTML
    });
    if (history.past.length > MAX_GLOBAL_HISTORY) history.past.shift();
    history.future = [];
    setGlobalHistoryVersion(v => v + 1);
  }, []);

  const globalUndo = useCallback(() => {
    const history = globalHistoryRef.current;
    if (history.past.length === 0) return;
    const entry = history.past.pop();
    // Save current state of that element to future
    history.future.push({
      element: entry.element,
      cssText: entry.element.style.cssText,
      innerHTML: entry.element.innerHTML
    });
    // Restore
    entry.element.style.cssText = entry.cssText;
    entry.element.innerHTML = entry.innerHTML;
    // Flash highlight
    entry.element.style.outline = '3px solid rgba(59, 130, 246, 0.8)';
    entry.element.style.outlineOffset = '2px';
    setTimeout(() => {
      entry.element.style.outline = '';
      entry.element.style.outlineOffset = '';
    }, 600);
    setGlobalHistoryVersion(v => v + 1);
  }, []);

  const globalRedo = useCallback(() => {
    const history = globalHistoryRef.current;
    if (history.future.length === 0) return;
    const entry = history.future.pop();
    // Save current state to past
    history.past.push({
      element: entry.element,
      cssText: entry.element.style.cssText,
      innerHTML: entry.element.innerHTML
    });
    // Restore
    entry.element.style.cssText = entry.cssText;
    entry.element.innerHTML = entry.innerHTML;
    // Flash highlight
    entry.element.style.outline = '3px solid rgba(249, 115, 22, 0.8)';
    entry.element.style.outlineOffset = '2px';
    setTimeout(() => {
      entry.element.style.outline = '';
      entry.element.style.outlineOffset = '';
    }, 600);
    setGlobalHistoryVersion(v => v + 1);
  }, []);

  // Helper: Check if element is a meaningful stylable element
  const isStylableElement = useCallback((target) => {
    if (!target || target === previewRef.current) return false;
    // Exclude the main preview container itself and very high-level wrappers
    if (target.classList?.contains('isolate')) return false;
    // Exclude element wrappers (we want to style the content inside)
    if (target.hasAttribute('data-wrapper')) return false;

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
      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setElementLibraryOpen(prev => !prev);
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

  // --- Click-through cycling state ---
  const clickCycleRef = useRef({ x: 0, y: 0, elements: [], index: -1, timestamp: 0 });

  const handlePreviewClick = useCallback((e) => {
    if (!styleEditorEnabled) return;

    e.preventDefault();
    e.stopPropagation();

    const clickX = e.clientX;
    const clickY = e.clientY;
    const now = Date.now();
    const cycle = clickCycleRef.current;

    // Check if this click is at roughly the same position as the last one (within 5px)
    // and within 1.5 seconds — if so, cycle to the next element
    const isSameSpot = Math.abs(clickX - cycle.x) < 5 && Math.abs(clickY - cycle.y) < 5;
    const isRecent = (now - cycle.timestamp) < 1500;

    if (isSameSpot && isRecent && cycle.elements.length > 0) {
      // Cycle to the next element in the stack
      cycle.index = (cycle.index + 1) % cycle.elements.length;
      cycle.timestamp = now;
    } else {
      // New click position — gather all stylable elements at this point
      const allElements = document.elementsFromPoint(clickX, clickY);
      const stylableElements = allElements.filter(el => {
        // Must be inside the preview container
        if (!previewRef.current?.contains(el)) return false;
        return isStylableElement(el);
      });

      // Deduplicate (elementsFromPoint can return parent+child at same point)
      // Keep unique elements, ordered from topmost to bottommost
      const seen = new Set();
      const uniqueElements = stylableElements.filter(el => {
        if (seen.has(el)) return false;
        seen.add(el);
        return true;
      });

      cycle.x = clickX;
      cycle.y = clickY;
      cycle.elements = uniqueElements;
      cycle.index = 0;
      cycle.timestamp = now;
    }

    const selectedEl = cycle.elements[cycle.index];
    if (selectedEl) {
      // Assign a temporary edit ID if not present
      if (!selectedEl.getAttribute('data-field') && !selectedEl.getAttribute('data-edit-id')) {
        const uniqueId = `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        selectedEl.setAttribute('data-edit-id', uniqueId);
        selectedEl.setAttribute('data-original-text', selectedEl.innerText);
      }

      const rect = selectedEl.getBoundingClientRect();
      setStyleEditorPosition({ x: rect.right + 10, y: rect.top });
      setStyleEditorTarget(selectedEl);

      // Briefly highlight the selected element to show what was picked
      selectedEl.style.outline = '3px solid rgba(59, 130, 246, 1)';
      selectedEl.style.outlineOffset = '2px';
      setTimeout(() => {
        selectedEl.style.outline = '';
        selectedEl.style.outlineOffset = '';
      }, 800);
    }
  }, [styleEditorEnabled, isStylableElement]);

  // Handle style updates from the editor
  const handleStyleUpdate = useCallback((newStyles) => {
    if (!styleEditorTarget) return;
    const el = styleEditorTarget;

    // Global snapshot BEFORE applying changes (captures ALL inline styles)
    globalSnapshot(el);

    // Use setProperty with 'important' to override CSS specificity issues
    // especially for AI-generated sections with inline styles

    // --- Text Color / Text Gradient ---
    if (newStyles.textGradientEnabled) {
      const grad = `linear-gradient(${newStyles.textGradientDirection || 'to right'}, ${newStyles.textGradientFrom || '#3b82f6'}, ${newStyles.textGradientTo || '#ec4899'})`;
      el.style.setProperty('background', grad, 'important');
      el.style.setProperty('-webkit-background-clip', 'text', 'important');
      el.style.setProperty('background-clip', 'text', 'important');
      el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      el.style.setProperty('color', 'transparent', 'important');
    } else {
      // Clear text gradient properties
      el.style.removeProperty('-webkit-background-clip');
      el.style.removeProperty('background-clip');
      el.style.removeProperty('-webkit-text-fill-color');

      if (newStyles.color) {
        el.style.setProperty('color', newStyles.color, 'important');
      }

      // --- Background / Background Gradient ---
      if (newStyles.bgGradientEnabled) {
        const bgGrad = `linear-gradient(${newStyles.bgGradientDirection || 'to right'}, ${newStyles.bgGradientFrom || '#3b82f6'}, ${newStyles.bgGradientTo || '#8b5cf6'})`;
        el.style.setProperty('background', bgGrad, 'important');
        el.style.removeProperty('background-color');
      } else if (newStyles.backgroundColor) {
        el.style.setProperty('background-color', newStyles.backgroundColor, 'important');
        el.style.setProperty('background', newStyles.backgroundColor, 'important');
      } else {
        el.style.removeProperty('background-color');
        el.style.removeProperty('background');
      }
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
      // Global snapshot before text change
      globalSnapshot(styleEditorTarget);

      // Smart text update: preserve HTML structure, only change text nodes
      // Walk the DOM to find the deepest element with actual text content
      const updateTextPreservingStructure = (el, text) => {
        // If the element has child elements, find the deepest text-bearing one
        const childElements = el.querySelectorAll('*');
        if (childElements.length > 0) {
          // Find leaf elements that contain text (not just whitespace)
          for (const child of childElements) {
            // Check if this child has direct text nodes (not from sub-children)
            for (const node of child.childNodes) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = text;
                return true;
              }
            }
          }
        }
        // Fallback: if no child elements with text found,
        // update direct text nodes of the element itself
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = text;
            return true;
          }
        }
        // Last resort: set innerText (only for simple text elements)
        el.innerText = text;
        return true;
      };

      updateTextPreservingStructure(styleEditorTarget, newText);
    }
  }, [styleEditorTarget, globalSnapshot]);

  // Apply theme to the preview container whenever it changes
  useEffect(() => {
    if (previewRef.current && activeTheme) {
      applyThemeToDocument(activeTheme, previewRef.current);
    }
  }, [activeTheme]);

  // Prevent link/button navigation in preview (allows styling instead)
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const preventNavigation = (e) => {
      const target = e.target.closest('a, button[type="submit"], [onclick]');
      if (target) {
        e.preventDefault();
        // Don't stop propagation - let style editor click handler still work
      }
    };

    container.addEventListener('click', preventNavigation, true);
    return () => container.removeEventListener('click', preventNavigation, true);
  }, []);

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
          {/* Global Undo/Redo */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-1 py-0.5">
            <button
              onClick={globalUndo}
              disabled={globalHistoryRef.current.past.length === 0}
              className={`relative p-1.5 rounded transition-colors ${globalHistoryRef.current.past.length > 0
                ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                : 'text-gray-300 cursor-not-allowed'
                }`}
              title={`Undo last style change (${globalHistoryRef.current.past.length} available)`}
            >
              <Undo2 size={14} />
              {globalHistoryRef.current.past.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {globalHistoryRef.current.past.length}
                </span>
              )}
            </button>
            <button
              onClick={globalRedo}
              disabled={globalHistoryRef.current.future.length === 0}
              className={`relative p-1.5 rounded transition-colors ${globalHistoryRef.current.future.length > 0
                ? 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                : 'text-gray-300 cursor-not-allowed'
                }`}
              title={`Redo style change (${globalHistoryRef.current.future.length} available)`}
            >
              <Redo2 size={14} />
              {globalHistoryRef.current.future.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {globalHistoryRef.current.future.length}
                </span>
              )}
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200" />

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

          {/* Element Library Toggle */}
          <button
            onClick={() => setElementLibraryOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded-md transition-all shadow-sm group ${elementLibraryOpen
              ? 'bg-purple-500 text-white border-purple-600 hover:bg-purple-600'
              : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-purple-600 border-gray-200 hover:border-purple-300'
              }`}
            title="Element Library: Drag and drop UI elements like buttons, arrows, and badges into your preview. Press 'A' to toggle."
          >
            <Layers size={13} className={elementLibraryOpen ? 'text-white' : 'text-purple-500'} />
            <span>Elements</span>
            <span className="text-[10px] opacity-60 ml-1">(A)</span>
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

      {/* Element Library Panel */}
      <ElementLibrary
        isOpen={elementLibraryOpen}
        onClose={() => setElementLibraryOpen(false)}
      />

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
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const html = e.dataTransfer.getData('text/html');
            const elementDataStr = e.dataTransfer.getData('application/element-library');

            if (html && elementDataStr) {
              const elementData = JSON.parse(elementDataStr);
              // Get container rect
              const containerRect = previewRef.current.getBoundingClientRect();

              // Calculate relative position accounting for scroll
              const x = e.clientX - containerRect.left + previewRef.current.scrollLeft;
              const y = e.clientY - containerRect.top + previewRef.current.scrollTop;

              // Add new element to store
              addElement({
                ...elementData,
                id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                x,
                y,
                width: 'auto',
                height: 'auto'
              });
            }
          }}
        >
          <div className="min-h-full isolate relative">
            {/* Render Absolute Elements Layer */}
            {activePage?.elements && activePage.elements.map(el => (
              <VisualElementWrapper
                key={el.id}
                element={el}
                isSelected={selectedElementId === el.id}
                onSelect={() => {
                  setSelectedElementId(el.id);
                  setSelectedSectionId(null); // Deselect section
                }}
                onChange={(updates) => updateElement(el.id, updates)}
                onDelete={() => deleteElement(el.id)}
                scale={1}
                pages={pages}
              />
            ))}

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