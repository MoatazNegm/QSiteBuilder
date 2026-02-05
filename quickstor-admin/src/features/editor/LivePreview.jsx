import React from 'react';
import { useContentStore } from '../../hooks/useContentStore';

// Import Data Source for static elements (Navbar/Footer)
import { defaultContent } from '../../../../quickstor-frontend/src/data/defaultContent';

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

const LivePreview = () => {
  const {
    sections,
    navbar,
    footer,
    setActivePageId,
    selectedSectionId,
    setSelectedSectionId,
    deleteSection,
    reorderSections,
    updateSection
  } = useContentStore();

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
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-center text-xs text-gray-400 shadow-sm z-10 shrink-0">
        <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          quickstor.com (Preview)
        </div>
      </div>

      {/* The actual website iframe/container */}
      <div className="flex-1 relative w-full h-full" style={{ transform: 'translate(0)' }}>
        <div className="absolute inset-0 overflow-y-auto bg-black">
          <div className="min-h-full text-white isolate">
            {/* Navbar will now be fixed relative to the preview window */}
            <Navbar
              {...navbar}
              onLogoClick={() => setActivePageId('home')}
            />

            <div className="flex flex-col">
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