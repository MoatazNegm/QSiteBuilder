import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Wand2, Loader2, Upload, Clipboard, FileText, Image, X, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';
import { generateSectionContent } from '../../utils/geminiService';
import { getProviderInfo } from '../../utils/aiService';

/**
 * AI Content Filler Component
 * Provides AI-powered content generation for section fields
 */
const AIContentFiller = ({ sectionType, currentContent, onApply }) => {
    const fileInputRef = useRef(null);

    // UI State
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [progressStatus, setProgressStatus] = useState('');

    // Input State
    const [userPrompt, setUserPrompt] = useState('');
    const [attachment, setAttachment] = useState(null);

    // Handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const isImage = file.type.startsWith('image/');
            let content;

            if (isImage) {
                content = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            } else {
                content = await file.text();
            }

            setAttachment({
                type: file.type || 'text/plain',
                name: file.name,
                size: file.size,
                base64: isImage ? content : null,
                text: isImage ? null : content
            });
            setError(null);
        } catch (e) {
            console.error('File read error', e);
            setError('Failed to read file');
        } finally {
            event.target.value = '';
        }
    };

    // Handle paste from clipboard
    const handlePaste = async () => {
        try {
            // Try to read as image first
            const items = await navigator.clipboard.read().catch(() => null);
            if (items && items.length > 0) {
                for (const item of items) {
                    if (item.types.some(t => t.startsWith('image/'))) {
                        const blob = await item.getType(item.types.find(t => t.startsWith('image/')));
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });

                        setAttachment({
                            type: blob.type,
                            name: 'Pasted Image',
                            size: blob.size,
                            base64: base64,
                            text: null
                        });
                        return;
                    }
                }
            }

            // Fallback to text
            const text = await navigator.clipboard.readText();
            if (text && text.trim().length > 0) {
                setAttachment({
                    type: 'text/plain',
                    name: 'Pasted Text',
                    size: text.length,
                    base64: null,
                    text: text
                });
                return;
            }

            setError('Clipboard is empty');
        } catch (err) {
            console.error('Paste failed:', err);
            // Fallback to manual input
            const manualPaste = prompt("Paste your context text here:");
            if (manualPaste) {
                setAttachment({
                    type: 'text/plain',
                    name: 'Pasted Text',
                    size: manualPaste.length,
                    base64: null,
                    text: manualPaste
                });
            }
        }
    };

    // Generate content with AI
    const handleGenerate = async () => {
        if (!userPrompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setProgressStatus('Starting...');

        try {
            const generatedData = await generateSectionContent(
                sectionType,
                userPrompt,
                currentContent,
                attachment,
                (status) => setProgressStatus(status)  // Progress callback
            );

            // Apply the generated content
            onApply(generatedData);

            // Reset state
            setUserPrompt('');
            setAttachment(null);
            setIsExpanded(false);
            setProgressStatus('');
        } catch (err) {
            console.error('AI Generation Failed:', err);
            setError(err.message || 'Failed to generate content. Try a different prompt.');
        } finally {
            setIsGenerating(false);
            setProgressStatus('');
        }
    };

    const providerInfo = getProviderInfo();

    return (
        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-lg border border-violet-200 overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-3 flex items-center justify-between hover:bg-violet-100/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-violet-600" />
                    <span className="text-sm font-medium text-violet-900">AI Content Filler</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-violet-200 text-violet-700 rounded">
                        {providerInfo.name}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp size={16} className="text-violet-500" />
                ) : (
                    <ChevronDown size={16} className="text-violet-500" />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Prompt Input */}
                    <div>
                        <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            placeholder="Describe what content you want to generate for this section..."
                            className="w-full h-24 p-3 text-sm rounded-md border border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-white text-gray-900 placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    {/* Attachment Controls */}
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-7 text-xs gap-1.5 bg-white text-violet-700 border-violet-200 hover:bg-violet-50"
                        >
                            <Upload size={12} /> Upload
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePaste}
                            className="h-7 text-xs gap-1.5 bg-white text-violet-700 border-violet-200 hover:bg-violet-50"
                        >
                            <Clipboard size={12} /> Paste
                        </Button>
                        <span className="text-[10px] text-violet-400 ml-auto">Optional context</span>
                    </div>

                    {/* Attachment Preview */}
                    {attachment && (
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-violet-200 shadow-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-7 h-7 rounded bg-violet-100 flex items-center justify-center shrink-0 text-violet-600">
                                    {attachment.type.startsWith('image/') ? <Image size={12} /> : <FileText size={12} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-medium text-gray-900 truncate">{attachment.name}</span>
                                    <span className="text-[10px] text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setAttachment(null)}
                                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={!userPrompt.trim() || isGenerating}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-none shadow-md gap-2 h-9"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 size={14} />
                                Fill Fields with AI
                            </>
                        )}
                    </Button>

                    {/* Progress Status */}
                    {isGenerating && progressStatus && (
                        <div className="p-2 bg-violet-100 border border-violet-200 rounded text-xs text-violet-700 text-center animate-pulse">
                            {progressStatus}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIContentFiller;
