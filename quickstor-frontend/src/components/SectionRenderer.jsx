import React from 'react';
import Hero from './Hero';
import ComparisonGraph from './ComparisonGraph';
import FeatureGrid from './FeatureGrid';
import CustomHTMLSection from './CustomHTMLSection';

// Map string types to actual React components
const COMPONENT_MAP = {
  'HERO': Hero,
  'COMPARISON_GRAPH': ComparisonGraph,
  'FEATURE_GRID': FeatureGrid,
  'CUSTOM_HTML': CustomHTMLSection,
  // Future components (e.g., 'TESTIMONIALS', 'PRICING') can be added here
};

export const SectionRenderer = ({ sections }) => {
  if (!sections || !Array.isArray(sections)) {
    return null;
  }

  return (
    <>
      {sections.map((section) => {
        const Component = COMPONENT_MAP[section.type];

        if (!Component) {
          console.warn(`Unknown section type: ${section.type}`);
          return null;
        }

        // Pass the content object as props to the specific component
        // Use section.id as the React key
        return <Component key={section.id} {...section.content} />;
      })}
    </>
  );
};