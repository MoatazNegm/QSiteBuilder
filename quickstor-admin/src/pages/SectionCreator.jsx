import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Sparkles, Code, Play, Save, Send, AlertCircle, Check, User, Bot, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { CodeHighlighter } from '../components/ui/CodeHighlighter';
import { generateSectionHTML, editSectionWithChat } from '../utils/sectionGeneratorService';
import CustomHTMLSection from '../components/CustomHTMLSection';
import { useContentStore } from '../hooks/useContentStore';
import { getProviderInfo } from '../utils/aiService';

const SectionCreator = () => {
  const navigate = useNavigate();
  const { customSections, setCustomSections } = useContentStore();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Generated content
  const [generatedCode, setGeneratedCode] = useState('');
  const [sectionSchema, setSectionSchema] = useState([]);
  const [sectionContent, setSectionContent] = useState({});
  const [viewMode, setViewMode] = useState('preview');

  // Streaming state
  const [streamingContent, setStreamingContent] = useState('');

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamingContent]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isGenerating) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setError(null);
    setIsGenerating(true);
    setStreamingContent('');

    // Add user message to chat
    const newUserMessage = { role: 'user', content: userMessage };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      let result;
      const onProgress = (chunk, fullText) => {
        setStreamingContent(prev => prev + chunk);
      };

      if (!generatedCode) {
        // First message = initial generation
        result = await generateSectionHTML(userMessage, onProgress);
      } else {
        // Subsequent messages = edit existing
        result = await editSectionWithChat(chatHistory, generatedCode, userMessage, onProgress);
      }

      setStreamingContent('');

      if (result.error) {
        setError(result.error);
        // Add error to chat
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: `❌ Error: ${result.error}`,
          isError: true
        }]);
      } else {
        setGeneratedCode(result.html);
        setSectionSchema(result.schema || []);
        setSectionContent(result.defaultContent || {});

        // Add success message to chat
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: generatedCode ? '✓ Section updated successfully!' : '✓ Section generated! You can now ask me to make changes.',
          html: result.html
        }]);
      }
    } catch (err) {
      setError(err.message);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
        isError: true
      }]);
    } finally {
      setIsGenerating(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartOver = () => {
    setChatHistory([]);
    setGeneratedCode('');
    setSectionSchema([]);
    setSectionContent({});
    setError(null);
  };

  const handlePublish = () => {
    if (!generatedCode) return;
    setShowPublishModal(true);
    const firstUserMessage = chatHistory.find(m => m.role === 'user');
    const suggestedName = firstUserMessage?.content?.substring(0, 30) || 'Custom Section';
    setSectionName(suggestedName);
  };

  const confirmPublish = () => {
    setIsPublishing(true);

    try {
      const firstUserMessage = chatHistory.find(m => m.role === 'user');
      const newSection = {
        id: `custom-${Date.now()}`,
        name: sectionName || 'Custom Section',
        html: generatedCode,
        schema: sectionSchema,
        defaultContent: sectionContent,
        prompt: firstUserMessage?.content || '',
        createdAt: new Date().toISOString()
      };

      // Add to content store (syncs with Firebase)
      const updated = [...customSections, newSection];
      setCustomSections(updated);
      localStorage.setItem('quickstor_custom_sections', JSON.stringify(updated));

      setIsPublishing(false);
      setShowPublishModal(false);
      navigate('/sections');
    } catch (err) {
      setError('Failed to save section');
      setIsPublishing(false);
    }
  };

  const examplePrompts = [
    'A pricing table with 3 plans highlighting the Pro plan',
    'A testimonials section with 3 customer quotes',
    'A stats section showing 4 performance metrics',
    'A FAQ section with 5 common questions'
  ];

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/sections">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-gray-200 bg-white hover:bg-gray-100 text-gray-700">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create with AI</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Chat with AI to build and refine your section</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                Using {getProviderInfo().name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {chatHistory.length > 0 && (
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="gap-2 bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
            >
              <Trash2 size={16} />
              Start Over
            </Button>
          )}
          <Button
            onClick={handlePublish}
            disabled={!generatedCode}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm border-transparent disabled:opacity-50"
          >
            <Save size={16} /> Publish to Library
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">

        {/* Left: Chat Panel */}
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  Describe the section you want to create. You can then chat to refine it.
                </p>
                <div className="space-y-2 w-full max-w-sm">
                  <Label className="text-xs text-gray-500">Try an example:</Label>
                  {examplePrompts.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentMessage(example)}
                      className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-lg transition-colors border border-gray-100 hover:border-blue-200"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : message.isError
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md max-w-[80%]">
                      {streamingContent ? (
                        <div className="text-sm space-y-2">
                          <p className="whitespace-pre-wrap font-mono text-xs text-gray-600">
                            {streamingContent.length > 300
                              ? '...' + streamingContent.slice(-300)
                              : streamingContent}
                          </p>
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden w-full">
                            <div className="h-full bg-blue-500 animate-[loading_1s_ease-in-out_infinite] w-1/3"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={generatedCode ? "Ask for changes..." : "Describe the section you want..."}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={isGenerating}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isGenerating}
                className="h-auto px-4 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                <Send size={18} />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Right: Preview & Code Panel */}
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="h-12 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between px-4 shrink-0">
            <div className="flex gap-1 p-1 bg-gray-200 rounded-lg">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'preview'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'
                  }`}
              >
                <Play size={14} /> Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'code'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'
                  }`}
              >
                <Code size={14} /> Code
              </button>
            </div>
            {generatedCode && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check size={14} /> Ready
              </span>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto relative bg-gray-100">
            {generatedCode ? (
              viewMode === 'preview' ? (
                <div className="w-full h-full bg-[#050505] overflow-auto">
                  <CustomHTMLSection html={generatedCode} content={sectionContent} />
                </div>
              ) : (
                <CodeHighlighter code={generatedCode} className="text-xs" />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <Play size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500">Preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish to Library"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Name</Label>
            <Input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g., Pricing Table"
              className="text-gray-900"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600">
            <p>This section will be saved to your local library.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setShowPublishModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPublish}
              disabled={!sectionName || isPublishing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {isPublishing ? 'Saving...' : <><Check size={16} /> Publish</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SectionCreator;