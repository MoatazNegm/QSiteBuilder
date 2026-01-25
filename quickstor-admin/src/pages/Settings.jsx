import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, AlertCircle, Download, Upload, Loader2, Database } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getAIConfig, saveAIConfig } from '../utils/aiService';
import { promptService } from '../utils/promptService';
import { useContentStore } from '../hooks/useContentStore';

const Settings = () => {
    const fileInputRef = useRef(null);
    const {
        pages,
        navbar,
        footer,
        activeTheme,
        savedThemes,
        customSections
    } = useContentStore();

    const [config, setConfig] = useState({
        provider: 'gemini', // 'gemini' | 'openai'
        openai: {
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o'
        }
    });

    const [systemPrompt, setSystemPrompt] = useState('');
    const [fillingPrompt, setFillingPrompt] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        // Load config on mount
        const savedConfig = getAIConfig();
        setConfig(savedConfig);

        // Ensure prompt service is ready, then load prompts
        const loadPrompt = async () => {
            await promptService.init();

            // 1. Load General System Prompt
            const customSystem = localStorage.getItem('quickstor_system_prompt_custom');
            setSystemPrompt(customSystem || promptService.get('system.default'));

            // 2. Load Content Filling Prompt
            setFillingPrompt(promptService.getContentFillingPrompt());
        };
        loadPrompt();
    }, []);

    const handleProviderChange = (value) => {
        setConfig(prev => ({
            ...prev,
            provider: value
        }));
    };

    const handleChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [config.provider]: {
                ...prev[config.provider],
                [field]: value
            }
        }));
    };

    const handleOpenAIChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            openai: {
                ...prev.openai,
                [field]: value
            }
        }));
    };

    const handleSave = () => {
        try {
            saveAIConfig(config);

            // 1. Save General System Prompt
            if (systemPrompt && systemPrompt !== promptService.get('system.default')) {
                localStorage.setItem('quickstor_system_prompt_custom', systemPrompt);
            } else {
                localStorage.removeItem('quickstor_system_prompt_custom');
            }

            // 2. Save Custom Content Filling Prompt
            // We compare essentially against the default agent prompt logic. 
            // Since getContentFillingPrompt returns the default if custom is missing, 
            // we can just check if it's diff from default or just save if not empty.
            if (fillingPrompt) {
                localStorage.setItem('quickstor_content_filling_prompt', fillingPrompt);
            } else {
                localStorage.removeItem('quickstor_content_filling_prompt');
            }

            setStatus({ type: 'success', message: 'Settings saved successfully' });

            // Clear status after 3 seconds
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to save settings' });
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        setStatus({ type: '', message: '' });

        try {
            // 1. Fetch Backend Data (for Live/legacy data)
            const response = await fetch('http://localhost:3000/api/data');
            if (!response.ok) throw new Error('Failed to fetch site data');
            const backendData = await response.json();

            // 2. Gather CURRENT Application State (In-Memory + Unsaved Changes)
            // This is the "Staging" state we want to preserve
            const appState = {
                pages,
                navbar,
                footer,
                theme: activeTheme,
                savedThemes,
                customSections
            };

            // 3. Gather Settings (Local Configuration)
            const settings = {
                // AI Configuration
                aiConfig: localStorage.getItem('quickstor_ai_config'),
                // Custom System Prompt
                systemPrompt: localStorage.getItem('quickstor_system_prompt_custom'),
                // Custom Filling Prompt
                fillingPrompt: localStorage.getItem('quickstor_content_filling_prompt'),
                // Cached prompts
                prompts: localStorage.getItem('quickstor_prompts'),
            };

            // 4. Create Comprehensive Backup Bundle
            const backup = {
                version: '3.0',
                timestamp: new Date().toISOString(),
                source: 'QuickStor Admin',
                // The critical part: explicitly separate app state from backend dump
                appState,
                settings,
                // Include full backend dump for safety (contains Live site)
                backendData
            };

            // 5. Trigger Download
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `quickstor-full-backup-${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            setStatus({ type: 'success', message: 'Full backup (including unsaved changes) downloaded!' });
        } catch (error) {
            console.error('Export failed:', error);
            setStatus({ type: 'error', message: 'Failed to create backup: ' + error.message });
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!confirm("WARNING: Restoring a backup will REPLACE your current Staging environment and Local Settings.\n\nYour LIVE site will remain untouched, but your current workspace will be overwritten.\n\nProceed?")) {
            event.target.value = '';
            return;
        }

        setIsImporting(true);
        setStatus({ type: '', message: '' });

        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            // Validation
            if (!backup.backendData) {
                throw new Error("Invalid backup format: missing backend data");
            }

            // --- 1. Restore Settings (AI, Prompts, etc.) ---
            if (backup.settings) {
                if (backup.settings.aiConfig) localStorage.setItem('quickstor_ai_config', backup.settings.aiConfig);
                if (backup.settings.systemPrompt) localStorage.setItem('quickstor_system_prompt_custom', backup.settings.systemPrompt);
                if (backup.settings.fillingPrompt) localStorage.setItem('quickstor_content_filling_prompt', backup.settings.fillingPrompt);
                if (backup.settings.prompts) localStorage.setItem('quickstor_prompts', backup.settings.prompts);

                // Backward compatibility for v2.0 backups
            } else if (backup.localConfig) {
                Object.entries(backup.localConfig).forEach(([key, value]) => {
                    // Only restore settings keys, ignore content keys (quickstor_pages etc) as we handle them globally
                    if (['quickstor_ai_config', 'quickstor_system_prompt_custom', 'quickstor_content_filling_prompt', 'quickstor_prompts'].includes(key)) {
                        if (value) localStorage.setItem(key, value);
                    }
                });
            }

            // --- 2. Construct New Backend Data ---
            // We take the backup's backend data as a base
            const newBackendData = { ...backup.backendData };

            // DETERMINE STAGING STATE TO RESTORE
            let stagingStateToRestore = null;

            if (backup.appState) {
                // v3.0: Use the explicit app state captured during export
                stagingStateToRestore = backup.appState;
                console.log('Restoring from v3.0 AppState');
            } else if (backup.localConfig) {
                // v2.0 Fallback: Try to reconstruct from localConfig in backup
                stagingStateToRestore = {
                    pages: backup.localConfig.quickstor_pages ? JSON.parse(backup.localConfig.quickstor_pages) : null,
                    navbar: backup.localConfig.quickstor_navbar ? JSON.parse(backup.localConfig.quickstor_navbar) : null,
                    footer: backup.localConfig.quickstor_footer ? JSON.parse(backup.localConfig.quickstor_footer) : null,
                    savedThemes: backup.localConfig.quickstor_savedThemes ? JSON.parse(backup.localConfig.quickstor_savedThemes) : null,
                    theme: backup.localConfig.quickstor_activeTheme ? JSON.parse(backup.localConfig.quickstor_activeTheme) : null,
                    customSections: backup.localConfig.quickstor_custom_sections ? JSON.parse(backup.localConfig.quickstor_custom_sections) : null
                };
                console.log('Restoring from v2.0 LocalConfig');
            }

            // --- 3. MERGE into Staging ---
            // We enforce that the "Staging" site becomes exactly what was in our backup (or working state)
            if (stagingStateToRestore) {
                // Ensure the staging node exists
                if (!newBackendData['sites/quickstor-staging']) {
                    newBackendData['sites/quickstor-staging'] = {};
                }

                // Merge/Overwrite Staging
                // This ensures that when the app reloads, it fetches THIS data as the "Server Truth"
                // which matches what was in our memory when we backed up.
                newBackendData['sites/quickstor-staging'] = {
                    ...newBackendData['sites/quickstor-staging'],
                    ...stagingStateToRestore,
                    // Ensure we update version/timestamp so the client knows it changed
                    version: `RESTORED-${Date.now()}`,
                    lastUpdated: new Date().toISOString()
                };
            }

            // --- 4. Push to Backend ---
            const response = await fetch('http://localhost:3000/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBackendData)
            });

            if (!response.ok) throw new Error('Failed to restore backend data');

            // --- 5. Clean Clean LocalStorage Content Items ---
            // Since we just updated the SERVER with our desired state, we can clear the 
            // local overrides to force the app to re-sync from the "new" server state.
            // This prevents "stale" localStorage from conflicting with our restoration.
            const contentKeys = [
                'quickstor_pages',
                'quickstor_navbar',
                'quickstor_footer',
                'quickstor_activeTheme',
                'quickstor_savedThemes',
                'quickstor_custom_sections'
            ];
            contentKeys.forEach(key => localStorage.removeItem(key));

            setStatus({ type: 'success', message: 'System restored successfully! Reloading...' });

            // Reload to apply changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('Import failed:', error);
            setStatus({ type: 'error', message: 'Failed to restore backup: ' + error.message });
        } finally {
            setIsImporting(false);
            event.target.value = '';
        }
    };

    const handleResetPrompt = async (type) => {
        if (type === 'filling') {
            if (confirm('Reset agent prompt to default?')) {
                localStorage.removeItem('quickstor_content_filling_prompt');
                // Force re-read default from service (re-instantiate logic)
                // Just manually setting the hardcoded string for immediate UI update is safer or re-call service
                // To avoid duplication, we will clear state and let reload or manual update handle it.
                // Actually, PromptService doesn't have a 'getDefaultFillingPrompt' public method, 
                // so we rely on getContentFillingPrompt falling back.

                // Hack: Temporarily remove, call get, set state
                const defaultPrompt = promptService.getContentFillingPrompt();
                setFillingPrompt(defaultPrompt);
            }
        } else {
            if (confirm('Reset system prompt to default?')) {
                const defaults = await promptService.resetToDefaults();
                const defaultPrompt = defaults?.system?.default || "";
                setSystemPrompt(defaultPrompt);
                localStorage.removeItem('quickstor_system_prompt_custom');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-1">Configure application preferences and integrations</p>
                </div>
                <Button onClick={handleSave} className="flex items-center gap-2">
                    <Save size={18} />
                    Save Changes
                </Button>
            </div>

            {/* Status Message */}
            {status.message && (
                <div className={`p-4 rounded-md flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {status.message}
                </div>
            )}

            {/* AI Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">AI Provider Configuration</h2>
                    <p className="text-sm text-gray-500 mt-1">Select which AI service to use for content generation</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`
              relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all
              ${config.provider === 'gemini' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
            `}>
                            <input
                                type="radio"
                                name="provider"
                                value="gemini"
                                checked={config.provider === 'gemini'}
                                onChange={(e) => handleProviderChange(e.target.value)}
                                className="absolute top-4 right-4"
                            />
                            <span className="font-semibold text-gray-900">Google Gemini</span>
                            <span className="text-sm text-gray-500 mt-1">Uses API Key from .env file (VITE_GEMINI_API_KEY)</span>
                        </label>

                        <label className={`
              relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all
              ${config.provider === 'openai' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
            `}>
                            <input
                                type="radio"
                                name="provider"
                                value="openai"
                                checked={config.provider === 'openai'}
                                onChange={(e) => handleProviderChange(e.target.value)}
                                className="absolute top-4 right-4"
                            />
                            <span className="font-semibold text-gray-900">OpenAI / Compatible</span>
                            <span className="text-sm text-gray-500 mt-1">Connect to OpenAI, DeepSeek, or other compatible APIs</span>
                        </label>
                    </div>

                    {/* OpenAI Configuration */}
                    {config.provider === 'openai' && (
                        <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                            <h3 className="font-medium text-gray-900">OpenAI Configuration</h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint (Base URL)</label>
                                    <input
                                        type="text"
                                        value={config.openai.baseUrl}
                                        onChange={(e) => handleOpenAIChange('baseUrl', e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave default for standard OpenAI, or change for local/compatible endpoints.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                    <input
                                        type="password"
                                        value={config.openai.apiKey}
                                        onChange={(e) => handleOpenAIChange('apiKey', e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                                    <input
                                        type="text"
                                        value={config.openai.model}
                                        onChange={(e) => handleOpenAIChange('model', e.target.value)}
                                        placeholder="gpt-4o"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                    Note: Gemini API Key is currently loaded from environment variables for security.
                </div>
            </div>

            {/* AI System Prompt */}
            {/* 1. General System Prompt (Restored) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Library Sections AI System Prompt</h2>
                        <p className="text-sm text-gray-500 mt-1">Customize the base instructions for general tasks.</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => handleResetPrompt('system')}
                        className="text-sm text-gray-500 hover:text-gray-900"
                    >
                        Reset to Default
                    </Button>
                </div>
                <div className="p-6">
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full h-80 font-mono text-sm p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
                        placeholder="Enter general system prompt..."
                    />
                </div>
            </div>

            {/* 2. Content Filling Agent Prompt (New) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">AI Filling Content Prompt</h2>
                        <p className="text-sm text-gray-500 mt-1">Configure the agent persona that helps fill in section content.</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => handleResetPrompt('filling')}
                        className="text-sm text-gray-500 hover:text-gray-900"
                    >
                        Reset to Default Agent
                    </Button>
                </div>
                <div className="p-6">
                    <textarea
                        value={fillingPrompt}
                        onChange={(e) => setFillingPrompt(e.target.value)}
                        className="w-full h-80 font-mono text-sm p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
                        placeholder="Enter agent system prompt..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        This prompt controls the AI Agent when generating/filling content from the property panel.
                    </p>
                </div>
            </div>

            {/* Backup & Restore System */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center gap-2">
                    <Database size={20} className="text-purple-600" />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">System Backup & Restore</h2>
                        <p className="text-sm text-gray-500 mt-1">Download a full snapshot of your site content, settings, and themes.</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Export */}
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <Download size={18} className="text-blue-600" />
                                    Download Backup
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Create a JSON file containing all pages, navigation, global settings, custom sections, and themes. Use this to save your progress.
                                </p>
                            </div>
                            <Button onClick={handleExport} disabled={isExporting} variant="outline" className="w-full justify-center bg-white">
                                {isExporting ? <><Loader2 size={16} className="animate-spin" /> Creating Backup...</> : 'Download Backup (.json)'}
                            </Button>
                        </div>

                        {/* Import */}
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <Upload size={18} className="text-green-600" />
                                    Restore from Backup
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Restore your site to a previous state using a backup file.
                                    <span className="block mt-1 font-semibold text-red-500 text-xs">⚠️ This will overwrite all current content!</span>
                                </p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                            <Button onClick={handleImportClick} disabled={isImporting} variant="outline" className="w-full justify-center bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                {isImporting ? <><Loader2 size={16} className="animate-spin" /> Restoring...</> : 'Restore Backup'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
