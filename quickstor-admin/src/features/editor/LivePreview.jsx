import React from 'react';
import { Settings } from 'lucide-react';
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
  const previewRef = React.useRef(null);
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

  // Apply theme to the preview container whenever it changes
  React.useEffect(() => {
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
        <button
          onClick={() => {
            if (confirm('Reset layout for all sections on this page? This will reset scale to 100% and position to original.')) {
              resetPageLayout(activePage?.id || activePageId);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-md transition-all shadow-sm group"
          title="Reset All Sections Scale & Position"
        >
          <Settings size={13} className="group-hover:rotate-180 transition-transform duration-500" />
          <span>Reset Page Layout</span>
        </button>
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
    </div>
  );
};

export default LivePreview;