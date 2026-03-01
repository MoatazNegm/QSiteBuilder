
import React, { useState } from 'react';
import { X, Sparkles, Code, Play, Check, Loader2, RotateCcw } from 'lucide-react';
import { AIService } from '../../utils/aiService';
import { cn } from '../../utils/cn';

const AICreatorModal = ({ isOpen, onClose, onSave }) => {
    const [prompt, setPrompt] = useState('');
    const [code, setCode] = useState('');
    const [generatedHtml, setGeneratedHtml] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('description'); // 'description' | 'code'

    // Draggable Logic
    const [pos, setPos] = useState({ x: window.innerWidth / 2 - 450, y: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = React.useRef({ x: 0, y: 0 });
    const startPosRef = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (!e.target.closest('[data-drag-handle]')) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startPosRef.current = { ...pos };
    };

    React.useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e) => {
            setPos({
                x: startPosRef.current.x + (e.clientX - dragStartRef.current.x),
                y: startPosRef.current.y + (e.clientY - dragStartRef.current.y)
            });
        };
        const handleMouseUp = () => setIsDragging(false);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const [name, setName] = useState('');

    const handleGenerate = async () => {
        if (!prompt && !code) return;

        setIsGenerating(true);
        setError(null);

        try {
            const html = await AIService.generateElement(prompt, mode === 'code' ? code : null);
            // Clean up Markdown if present
            let cleanHtml = html.replace(/```html/g, '').replace(/```/g, '').trim();

            // Sanitize classes: Remove any positioning or z-index classes that conflict with wrapper
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(cleanHtml, 'text/html');
                const rootEl = doc.body.firstElementChild;
                if (rootEl) {
                    rootEl.classList.remove('absolute', 'fixed', 'relative', 'static', 'sticky');
                    rootEl.className = rootEl.className.replace(/\bz-\[?-?\d+\]?\b/g, '').replace(/\s+/g, ' ').trim();
                    cleanHtml = rootEl.outerHTML;
                }
            } catch (e) {
                console.error("Failed to sanitize AI HTML classes", e);
            }

            setGeneratedHtml(cleanHtml);

            // Auto-generate a name if empty
            if (!name) {
                const autoName = prompt.split(' ').slice(0, 3).join(' ') || 'New Element';
                setName(autoName.charAt(0).toUpperCase() + autoName.slice(1));
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to generate element.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAccept = () => {
        if (generatedHtml) {
            onSave(generatedHtml, name);
            handleClose();
        }
    };

    const handleClose = () => {
        setPrompt('');
        setCode('');
        setGeneratedHtml(null);
        setError(null);
        setName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                style={{
                    position: 'fixed',
                    top: pos.y,
                    left: pos.x,
                    zIndex: 10000
                }}
                className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200"
                onMouseDown={handleMouseDown}
            >

                {/* Header - Draggable */}
                <div
                    data-drag-handle="true"
                    className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-white cursor-grab active:cursor-grabbing"
                >
                    <div className="flex items-center gap-2 pointer-events-none">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">AI Element Creator</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500">Describe or refine an element using AI</p>
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium border border-purple-200">
                                    {AIService.getProviderInfo().provider} ({AIService.getProviderInfo().model})
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Input Panel */}
                    <div className="w-full md:w-1/3 border-r bg-gray-50 p-4 flex flex-col gap-4 overflow-y-auto">

                        <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
                            <button
                                onClick={() => setMode('description')}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                                    mode === 'description' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                New from Text
                            </button>
                            <button
                                onClick={() => setMode('code')}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                                    mode === 'code' ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                Refine Code
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700">
                                {mode === 'description' ? 'Describe the element' : 'Instructions'}
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={mode === 'description' ? "e.g. A modern gradient button with a shadow and hover effect..." : "e.g. Make this button red and round..."}
                                className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        {mode === 'code' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700">Existing Code</label>
                                <textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="<button class='...'>...</button>"
                                    className="w-full h-32 p-3 text-xs font-mono bg-white text-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || (!prompt && !code)}
                            className="mt-auto w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGenerating ? 'Generating...' : 'Generate Element'}
                        </button>
                    </div>

                    {/* Preview Panel */}
                    <div className="flex-1 flex flex-col bg-gray-100/50">
                        <div className="px-4 py-2 border-b bg-white flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview</h3>
                            {generatedHtml && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setGeneratedHtml(null)}
                                        className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                                    >
                                        <RotateCcw size={12} /> Reset
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-8 flex items-center justify-center overflow-auto pattern-grid">
                            {generatedHtml ? (
                                <div
                                    className="scale-[1] origin-center transition-all"
                                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                                />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Sparkles size={24} className="text-gray-300" />
                                    </div>
                                    <p className="text-sm">Enter a description to generate a preview</p>
                                </div>
                            )}
                        </div>

                        {generatedHtml && (
                            <div className="p-4 border-t bg-white flex justify-between items-center gap-3">
                                <div className="flex-1 mr-4">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Element Name"
                                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAccept}
                                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                                    >
                                        <Check size={16} /> Accept & Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICreatorModal;
