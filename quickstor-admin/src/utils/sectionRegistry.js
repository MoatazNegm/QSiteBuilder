// Imports directly from the frontend project
// Note: Relative paths assume standard sibling project structure
import Hero from '../../../quickstor-frontend/src/components/Hero';
import ComparisonGraph from '../../../quickstor-frontend/src/components/ComparisonGraph';
import FeatureGrid from '../../../quickstor-frontend/src/components/FeatureGrid';
import CustomHTMLSection from '../components/CustomHTMLSection';

// Map string types to actual React components
export const SECTION_COMPONENTS = {
  'HERO': Hero,
  'COMPARISON_GRAPH': ComparisonGraph,
  'FEATURE_GRID': FeatureGrid,
  'CUSTOM_HTML': CustomHTMLSection,
};

export const getComponentByType = (type) => {
  return SECTION_COMPONENTS[type] || null;
};

// Section type metadata for UI display
export const SECTION_TYPE_INFO = {
  'HERO': {
    name: 'Hero Section',
    description: 'Main landing banner with CTA.',
    icon: 'Layout'
  },
  'COMPARISON_GRAPH': {
    name: 'Comparison Graph',
    description: 'Bar chart comparing performance stats.',
    icon: 'BarChart2'
  },
  'FEATURE_GRID': {
    name: 'Feature Grid',
    description: 'Grid of icon cards describing features.',
    icon: 'Grid3x3'
  },
  'CUSTOM_HTML': {
    name: 'Custom Section',
    description: 'AI-generated custom HTML section.',
    icon: 'Sparkles'
  }
};