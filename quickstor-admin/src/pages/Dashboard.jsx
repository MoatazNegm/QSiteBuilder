import { Save, Palette, ExternalLink, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import EditorContainer from '../features/editor/EditorContainer';

import { useContentStore } from '../hooks/useContentStore';

const Dashboard = () => {
  const {
    saveContent,
    discardChanges,
    activeTheme,
    savedThemes,
    applyTheme,
    publishStagingToLive,
    rejectStaging,
    hasUnsavedChanges,
    hasPendingPublish
  } = useContentStore();

  const handleSaveToStaging = async () => {
    if (!hasUnsavedChanges) return;
    const success = await saveContent();
    if (success) {
      console.log("Saved to staging");
      // Optional: Toast notification
    }
  };

  const handlePublishLive = async () => {
    if (!hasPendingPublish) return;
    if (confirm("Are you sure you want to publish the current Staging content to the LIVE website?")) {
      const success = await publishStagingToLive();
      if (success) {
        alert('Successfully published to Live!');
      }
    }
  };

  const handleReject = async () => {
    if (!hasPendingPublish) return;
    await rejectStaging();
  };

  const handleDiscard = () => {
    if (!hasUnsavedChanges) return;
    discardChanges();
  };

  const handleThemeChange = (e) => {
    const selectedTheme = savedThemes.find(t => t.id === e.target.value);
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Page Editor (Staging)</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Edit content here. Changes are saved to <strong>Staging</strong> first.</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <a href="http://localhost:5176" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline">
              <ExternalLink size={12} /> View Staging Site
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Theme Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
            <Palette size={16} className="text-gray-500" />
            <select
              value={activeTheme.id}
              onChange={handleThemeChange}
              className="bg-transparent text-sm text-gray-700 border-none outline-none cursor-pointer"
            >
              {savedThemes.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

          {/* Staging Actions */}
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
            title="Discard current session changes"
            className={`transition-colors ${!hasUnsavedChanges ? 'opacity-50 cursor-not-allowed text-gray-400 border-gray-200' : 'text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-100'}`}
          >
            <RotateCcw size={16} className="mr-1" /> Reset Session
          </Button>

          <Button
            variant="outline"
            onClick={handleReject}
            disabled={!hasPendingPublish}
            title="Revert Staging to match Live"
            className={`transition-colors ${!hasPendingPublish ? 'opacity-50 cursor-not-allowed text-gray-400 border-gray-200' : 'text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50'}`}
          >
            <X size={16} className="mr-1" /> Reject Staging
          </Button>

          <Button
            variant="outline"
            onClick={handleSaveToStaging}
            disabled={!hasUnsavedChanges}
            className={`transition-colors ${!hasUnsavedChanges ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
          >
            <Save size={16} className="mr-1" /> Save to Staging
          </Button>

        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 min-h-0">
        <EditorContainer />
      </div>
    </div>
  );
};

export default Dashboard;