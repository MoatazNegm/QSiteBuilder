import React, { useState, useEffect } from 'react';
import { useContentStore } from '../../hooks/useContentStore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Plus, ChevronDown, BarChart2, Grid, Sparkles, Layout, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { getCustomSections } from '../../utils/sectionGeneratorService';

const SectionList = () => {
  const {
    sections, selectedSectionId, setSelectedSectionId, reorderSections, deleteSection, addSection
  } = useContentStore();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [customSections, setCustomSections] = useState([]);

  // Page creation state
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  // Load custom sections from localStorage
  useEffect(() => {
    setCustomSections(getCustomSections());
  }, [isAddMenuOpen]); // Refresh when menu opens

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    reorderSections(items);
  };

  const handleAddSection = (type) => {
    addSection(type);
    setIsAddMenuOpen(false);
  };

  const handleAddCustomSection = (customSection) => {
    addSection('CUSTOM_HTML', {
      html: customSection.html,
      name: customSection.name,
      schema: customSection.schema || [],
      content: customSection.defaultContent || {}
    });
    setIsAddMenuOpen(false);
  };



  const getTypeIcon = (type) => {
    switch (type) {
      case 'COMPARISON_GRAPH': return <BarChart2 size={14} className="text-gray-400" />;
      case 'FEATURE_GRID': return <Grid size={14} className="text-gray-400" />;
      case 'HERO': return <Layout size={14} className="text-gray-400" />;
      case 'CUSTOM_HTML': return <Sparkles size={14} className="text-blue-400" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-80 shrink-0 font-sans">

      {/* --- Page Manager & Global Settings --- */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-4">
        {/* Global Settings */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedSectionId('NAVBAR')}
            className={cn(
              "px-3 py-2 text-xs font-medium rounded border transition-all text-center",
              selectedSectionId === 'NAVBAR'
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm"
            )}
          >
            Edit Navbar
          </button>
          <button
            onClick={() => setSelectedSectionId('FOOTER')}
            className={cn(
              "px-3 py-2 text-xs font-medium rounded border transition-all text-center",
              selectedSectionId === 'FOOTER'
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm"
            )}
          >
            Edit Footer
          </button>
        </div>
      </div>

      {/* --- Sections Header --- */}
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-20">
        <h2 className="font-semibold text-sm text-gray-700">Sections</h2>

        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="h-8 px-3 gap-2 text-xs bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
          >
            <Plus size={14} /> Add Section <ChevronDown size={12} />
          </Button>

          {/* Dropdown Menu (Existing) */}
          {isAddMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsAddMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 max-h-80 overflow-y-auto">
                {/* Built-in sections */}
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                  Built-in
                </div>
                <button
                  onClick={() => handleAddSection('COMPARISON_GRAPH')}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 bg-white hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                >
                  <BarChart2 size={16} className="text-gray-500" />
                  Comparison Graph
                </button>
                <button
                  onClick={() => handleAddSection('FEATURE_GRID')}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 bg-white hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                >
                  <Grid size={16} className="text-gray-500" />
                  Feature Grid
                </button>
                <button
                  onClick={() => handleAddSection('HERO')}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 bg-white hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                >
                  <Layout size={16} className="text-gray-500" />
                  Hero Section
                </button>

                {/* Custom sections */}
                {customSections.length > 0 && (
                  <>
                    <div className="border-t border-gray-100 mt-1" />
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium flex items-center gap-1">
                      <Sparkles size={10} className="text-blue-500" /> Your Custom Sections
                    </div>
                    {customSections.map((cs) => (
                      <button
                        key={cs.id}
                        onClick={() => handleAddCustomSection(cs)}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 bg-white hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                      >
                        <Sparkles size={16} className="text-blue-500" />
                        <span className="truncate">{cs.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-200">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        onClick={() => setSelectedSectionId(section.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-md border transition-all cursor-pointer group bg-white relative",
                          selectedSectionId === section.id
                            ? "border-blue-500 ring-1 ring-blue-500 shadow-sm z-10"
                            : "border-gray-200 hover:border-blue-300",
                          snapshot.isDragging && "shadow-xl ring-2 ring-blue-500 rotate-1 z-50 opacity-90 scale-105"
                        )}
                        style={provided.draggableProps.style}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-100"
                        >
                          <GripVertical size={14} />
                        </div>

                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {getTypeIcon(section.type)}
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {section.type === 'CUSTOM_HTML' ? (section.content?.name || 'Custom Section') : section.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate font-mono">
                              {section.id.split('-')[1] || section.id}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this section?')) {
                              deleteSection(section.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 bg-transparent border-0 hover:bg-red-50 hover:text-red-600 hover:border-transparent rounded-md transition-all focus:opacity-100 shadow-none"
                          title="Delete section"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default SectionList;