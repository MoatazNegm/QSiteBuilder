import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Box, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { getComponentByType } from '../utils/sectionRegistry';
import { useContentStore } from '../hooks/useContentStore';
import { defaultContent } from '../../../quickstor-frontend/src/data/defaultContent';

const SectionLibrary = () => {
  const [previewSection, setPreviewSection] = useState(null);

  // Get custom sections from content store (synced with Firebase)
  const { customSections, setCustomSections } = useContentStore();

  // Helper to find default props for a section type
  const getDefaultProps = (type) => {
    const example = defaultContent.sections.find(s => s.type === type);
    return example ? example.content : {};
  };

  // Built-in library sections
  const builtInLibrary = [
    { id: 'hero', name: 'Hero Section', type: 'HERO', description: 'Main landing banner with CTA.', lastModified: '2 days ago', isBuiltIn: true },
    { id: 'features', name: 'Feature Grid', type: 'FEATURE_GRID', description: 'Grid of icon cards describing features.', lastModified: '1 week ago', isBuiltIn: true },
    { id: 'graph', name: 'Comparison Graph', type: 'COMPARISON_GRAPH', description: 'Bar chart comparing performance stats.', lastModified: '3 days ago', isBuiltIn: true },
  ];

  // Combine built-in and custom sections
  const library = [
    ...builtInLibrary,
    ...customSections.map(s => ({
      id: s.id,
      name: s.name,
      type: 'CUSTOM_HTML',
      description: s.prompt?.substring(0, 60) + '...' || 'AI-generated section',
      lastModified: new Date(s.createdAt).toLocaleDateString(),
      isBuiltIn: false,
      html: s.html,
      schema: s.schema,
      defaultContent: s.defaultContent
    }))
  ];

  const handleDeleteCustom = (sectionId) => {
    if (confirm('Are you sure you want to delete this section?')) {
      const updated = customSections.filter(s => s.id !== sectionId);
      setCustomSections(updated);
      localStorage.setItem('quickstor_custom_sections', JSON.stringify(updated));
    }
  };

  const PreviewComponent = previewSection ? getComponentByType(previewSection.type) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Section Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the building blocks available for your pages.
          </p>
        </div>
        <Link to="/sections/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-transparent">
            <Plus size={16} /> Create with AI
          </Button>
        </Link>
      </div>

      {/* Custom Sections */}
      {customSections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Your Custom Sections</h2>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {customSections.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customSections.map((section) => (
              <Card key={section.id} className="group hover:shadow-md transition-all overflow-hidden flex flex-col border-gray-200 bg-white">
                {/* Thumbnail Area */}
                <div className="h-40 bg-[#050505] border-b border-gray-200 relative overflow-hidden">
                  {/* Mini Preview Rendering (Scaled down) */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div style={{
                      width: '400%',
                      transform: 'scale(0.25)',
                      transformOrigin: 'top left'
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: section.html }} />
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] z-10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white"
                      onClick={() => setPreviewSection({
                        ...section,
                        type: 'CUSTOM_HTML',
                        html: section.html
                      })}
                    >
                      <Eye size={14} className="mr-2" /> Quick View
                    </Button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{section.name}</h3>
                    <span className="text-[10px] bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-2 py-0.5 rounded font-mono uppercase border border-blue-100 flex items-center gap-1">
                      <Sparkles size={10} /> AI
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-4 flex-1 leading-relaxed line-clamp-2">
                    {section.prompt || 'Custom AI-generated section'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {new Date(section.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 bg-white border border-gray-200 text-gray-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm transition-all"
                      title="Delete"
                      onClick={() => handleDeleteCustom(section.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Built-in Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Built-in Sections</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {builtInLibrary.map((item) => {
            const Component = getComponentByType(item.type);
            const previewProps = getDefaultProps(item.type);

            return (
              <Card key={item.id} className="group hover:shadow-md transition-all overflow-hidden flex flex-col border-gray-200 bg-white">
                {/* Thumbnail Area */}
                <div className="h-40 bg-gray-100 border-b border-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white pointer-events-none">
                    {Component ? (
                      <div style={{
                        width: '400%',
                        transform: 'scale(0.25)',
                        transformOrigin: 'top left'
                      }}>
                        <Component {...previewProps} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <Box className="text-gray-300 w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] z-10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white"
                      onClick={() => setPreviewSection(item)}
                    >
                      <Eye size={14} className="mr-2" /> Quick View
                    </Button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono uppercase border border-blue-100">
                      {item.type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-4 flex-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Edited {item.lastModified}</span>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 shadow-sm transition-all" title="Edit">
                        <Edit size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewSection}
        onClose={() => setPreviewSection(null)}
        title={`Preview: ${previewSection?.name}`}
        className="max-w-[90vw]"
      >
        <div className="bg-[#050505] min-h-[400px] flex flex-col items-center justify-center overflow-auto">
          {previewSection?.type === 'CUSTOM_HTML' ? (
            <div className="w-full" dangerouslySetInnerHTML={{ __html: previewSection.html }} />
          ) : PreviewComponent ? (
            <div className="w-full bg-white">
              <PreviewComponent {...getDefaultProps(previewSection?.type)} />
            </div>
          ) : (
            <div className="text-gray-500">Preview not available</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SectionLibrary;