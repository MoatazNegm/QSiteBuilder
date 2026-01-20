import React, { useState } from 'react';
import { PanelRightClose, PanelRightOpen, Settings2 } from 'lucide-react';
import SectionList from './SectionList';
import LivePreview from './LivePreview';
import PropertyPanel from './PropertyPanel';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const EditorContainer = () => {
  const [showProperties, setShowProperties] = useState(true);

  return (
    <div className="flex h-[calc(100vh-6rem)] border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white relative">
      {/* Left: Navigation */}
      <SectionList />
      
      {/* Center: Preview Area */}
      {/* flex-1 ensures it takes remaining space. min-w-0 prevents flex overflow issues. */}
      <div className="flex-1 relative flex flex-col min-w-0 transition-all duration-300">
         <LivePreview />

         {/* Property Toggle Button */}
         <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowProperties(!showProperties)}
            className={cn(
              "absolute top-1.5 right-2 z-20 h-8 w-8",
              "bg-white/90 backdrop-blur border border-gray-200 shadow-sm",
              "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
              "text-gray-500 transition-all"
            )}
            title={showProperties ? "Hide Properties" : "Show Properties"}
         >
            {showProperties ? <PanelRightClose size={16} /> : <Settings2 size={16} />}
         </Button>
      </div>
      
      {/* Right: Editing */}
      {showProperties && (
        <PropertyPanel />
      )}
    </div>
  );
};

export default EditorContainer;