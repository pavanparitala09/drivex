import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, Download, Sparkles, Brain, Edit3, MessageSquare, Send } from 'lucide-react';
import api from '../utils/axios';

const FilePreviewModal = ({ file, isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const token = user?.token;
  const navigate = useNavigate();

  const [textContent, setTextContent] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);
  
  // AI Summary States
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // AI Chat States
  const [aiTab, setAiTab] = useState('summary'); // 'summary' | 'chat'
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && file) {
      const isText = file.mimeType.startsWith('text/') || 
                     file.filename.endsWith('.md') || 
                     file.filename.endsWith('.json') || 
                     file.filename.endsWith('.js') || 
                     file.filename.endsWith('.html') || 
                     file.filename.endsWith('.css');

      if (isText) {
        setIsTextLoading(true);
        setTextContent('');
        fetch(file.url)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch text content');
            return res.text();
          })
          .then((text) => {
            setTextContent(text);
            setIsTextLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setTextContent('Failed to load text file contents.');
            setIsTextLoading(false);
          });
      }

      // Reset summary & chat states
      setSummary('');
      setIsSummaryOpen(false);
      setIsSummaryLoading(false);
      setSummaryError('');
      setAiTab('summary');
      setChatHistory([]);
      setQuestion('');
      setChatLoading(false);
      setChatError('');
    }
  }, [file, isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading]);

  if (!isOpen || !file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isPDF = file.mimeType === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
  const isText = file.mimeType.startsWith('text/') || 
                 file.filename.endsWith('.md') || 
                 file.filename.endsWith('.json') || 
                 file.filename.endsWith('.js') || 
                 file.filename.endsWith('.html') || 
                 file.filename.endsWith('.css');

  // If it's not a supported preview type, fallback to opening in new window
  if (!isImage && !isVideo && !isText && !isPDF) {
    window.open(file.url, '_blank');
    onClose();
    return null;
  }

  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    setSummaryError('');
    setSummary('');
    try {
      const response = await api.post(`/files/${file._id}/summarize`);
      if (response.data.success) {
        setSummary(response.data.summary);
      } else {
        throw new Error(response.data.message || 'Failed to generate summary');
      }
    } catch (err) {
      console.error(err);
      setSummaryError(err.response?.data?.message || err.message || 'Failed to generate AI summary.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    const userQuestion = question.trim();
    setQuestion('');
    setChatError('');
    setChatLoading(true);

    // Optimistically update chat history with user's question
    setChatHistory(prev => [...prev, { sender: 'user', text: userQuestion }]);

    try {
      const res = await api.post(`/files/${file._id}/chat`, {
        question: userQuestion,
        history: chatHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          text: msg.text
        }))
      });

      if (res.data.success) {
        setChatHistory(prev => [...prev, { sender: 'model', text: res.data.answer }]);
      } else {
        throw new Error(res.data.message || 'Failed to get response');
      }
    } catch (err) {
      console.error(err);
      setChatError(err.response?.data?.message || err.message || 'Failed to communicate with AI.');
    } finally {
      setChatLoading(false);
    }
  };

  const renderSummary = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      // Parse bold tags **bold** into <strong> tags
      const formatBold = (str) => {
        return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      };

      if (line.startsWith('* ') || line.startsWith('- ')) {
        const bulletText = line.substring(2);
        return (
          <li 
            key={idx} 
            className="ml-4 list-disc text-slate-300 my-1 text-sm font-medium leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatBold(bulletText) }}
          />
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h4 
            key={idx} 
            className="text-xs font-bold text-indigo-400 mt-4 mb-1.5 uppercase tracking-wider"
            dangerouslySetInnerHTML={{ __html: formatBold(line.substring(4)) }}
          />
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 
            key={idx} 
            className="text-sm font-bold text-indigo-400 mt-5 mb-2 border-b border-slate-800 pb-1"
            dangerouslySetInnerHTML={{ __html: formatBold(line.substring(3)) }}
          />
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 
            key={idx} 
            className="text-base font-bold text-indigo-400 mt-6 mb-3 border-b border-slate-700 pb-1"
            dangerouslySetInnerHTML={{ __html: formatBold(line.substring(2)) }}
          />
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p 
          key={idx} 
          className="text-sm text-slate-300 my-1.5 leading-relaxed font-normal"
          dangerouslySetInnerHTML={{ __html: formatBold(line) }}
        />
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Premium Header */}
      <header className="h-16 w-full px-6 flex justify-between items-center bg-slate-950/80 border-b border-slate-900 z-50">
        <div className="text-white font-semibold truncate max-w-xl flex items-center gap-3">
          <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs font-mono text-slate-400 uppercase">
            {file.filename.split('.').pop()}
          </span>
          <span className="truncate">{file.filename}</span>
        </div>
        <div className="flex space-x-3 items-center">
          {/* AI Toggle Button */}
          {(isText || isImage || isPDF) && (
            <button 
              onClick={() => {
                setIsSummaryOpen(!isSummaryOpen);
                if (!isSummaryOpen && !summary && !isSummaryLoading) {
                  handleGenerateSummary();
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-md ${
                isSummaryOpen 
                  ? 'bg-indigo-600 text-white shadow-indigo-500/20' 
                  : 'bg-white/10 text-indigo-400 hover:bg-white/20 border border-indigo-500/20'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Summary</span>
            </button>
          )}
          
          {isText && (
            <button 
              onClick={() => {
                navigate(`/editor/${file._id}`);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
              title="Edit Document"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Document</span>
            </button>
          )}
          
          <button 
            onClick={() => window.open(file.url, '_blank')} 
            className="text-white/80 hover:text-white transition-all p-2.5 bg-white/5 rounded-xl hover:bg-white/10"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4.5 h-4.5" />
          </button>
          <a 
            href={file.url} 
            download={file.filename} 
            className="text-white/80 hover:text-white transition-all p-2.5 bg-white/5 rounded-xl hover:bg-white/10"
            title="Download"
          >
            <Download className="w-4.5 h-4.5" />
          </a>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-all p-2.5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl"
            title="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Split Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Content Preview Panel */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          {isImage && (
            <img 
              src={file.url} 
              alt={file.filename} 
              className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-2xl select-none" 
            />
          )}
          {isVideo && (
            <video 
              src={file.url} 
              controls 
              autoPlay 
              className="max-w-full max-h-full rounded-2xl drop-shadow-2xl outline-none bg-black" 
            />
          )}
          {isText && (
            isTextLoading ? (
              <div className="flex flex-col items-center justify-center text-white/60">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-semibold text-sm">Loading file content...</p>
              </div>
            ) : (
              <div className="w-full max-w-4xl max-h-[80vh] overflow-auto bg-slate-950/80 border border-slate-900 rounded-2xl p-6 text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text no-scrollbar shadow-2xl">
                {textContent}
              </div>
            )
          )}
          {isPDF && (
            <iframe 
              src={`http://localhost:5000/api/files/${file._id}/view?token=${token}`} 
              className="w-full h-[80vh] rounded-2xl bg-white border border-slate-800 shadow-2xl" 
              title={file.filename}
            />
          )}
        </div>

        {/* Right AI Summary & Chat Slide-out Sidebar */}
        {isSummaryOpen && (
          <div className="w-full md:w-96 border-l border-slate-900 bg-slate-950/90 backdrop-blur-md flex flex-col z-40 overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Sidebar Header */}
            <div className="p-5 border-b border-slate-900 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <span className="font-bold text-sm">AI Assistant</span>
                </div>
                <button 
                  onClick={() => setIsSummaryOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab selector */}
              <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 shadow-inner">
                <button
                  onClick={() => setAiTab('summary')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    aiTab === 'summary' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Summary
                </button>
                <button
                  onClick={() => setAiTab('chat')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    aiTab === 'chat' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat Workspace
                </button>
              </div>
            </div>

            {/* Sidebar Body */}
            {aiTab === 'summary' ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                {isSummaryLoading && (
                  <div className="space-y-4 py-8">
                    {/* Shimmer/Pulse Loading State */}
                    <div className="flex flex-col items-center justify-center space-y-3 text-center">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-12 h-12 bg-indigo-500/10 rounded-full animate-ping" />
                        <div className="relative bg-indigo-500/20 p-3 rounded-full text-indigo-400 animate-pulse">
                          <Brain className="w-6 h-6" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Analyzing file contents...</p>
                        <p className="text-xs text-slate-400 mt-1">This may take a few seconds.</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 pt-4">
                      <div className="h-4 bg-slate-900 rounded-lg animate-pulse w-full" />
                      <div className="h-4 bg-slate-900 rounded-lg animate-pulse w-[90%]" />
                      <div className="h-4 bg-slate-900 rounded-lg animate-pulse w-[95%]" />
                      <div className="h-4 bg-slate-900 rounded-lg animate-pulse w-[80%]" />
                    </div>
                  </div>
                )}

                {summaryError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-xs leading-relaxed space-y-2">
                    <p className="font-bold">Summary Failed</p>
                    <p className="font-medium text-slate-300">{summaryError}</p>
                    <button 
                      onClick={handleGenerateSummary}
                      className="w-full mt-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 font-semibold rounded-xl transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {summary && (
                  <div className="space-y-1 text-slate-300 pr-1 animate-in fade-in duration-500">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Summary & Insights</div>
                    <div className="prose prose-invert select-text">
                      {renderSummary(summary)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
                {/* Scrollable Messages list */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar flex flex-col">
                  {/* Greeting message if history is empty */}
                  {chatHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 space-y-3 px-4 my-auto">
                      <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-full">
                        <MessageSquare className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-300">Chat with AI about this file!</p>
                        <p className="text-[10px] text-slate-500 mt-1">E.g., "Summarize the key data" or "Find specific details"</p>
                      </div>
                    </div>
                  )}

                  {chatHistory.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none self-end ml-auto'
                          : 'bg-slate-900 text-slate-100 border border-slate-800/80 rounded-tl-none self-start mr-auto'
                      }`}
                    >
                      <div className="whitespace-pre-wrap select-text">{msg.text}</div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl rounded-tl-none p-3.5 self-start mr-auto max-w-[85%] flex items-center gap-1.5 text-slate-400 animate-pulse">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  {chatError && (
                    <div className="bg-rose-500/15 border border-rose-500/20 rounded-2xl p-3 text-rose-400 text-xs font-semibold self-start mr-auto max-w-[85%]">
                      {chatError}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about this file..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={chatLoading}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-medium placeholder-slate-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !question.trim()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-xl transition-all shadow-md flex items-center justify-center disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Sidebar Footer */}
            {aiTab === 'summary' && summary && !isSummaryLoading && (
              <div className="p-4 border-t border-slate-900 bg-slate-950 flex justify-between gap-3">
                <button 
                  onClick={handleGenerateSummary}
                  className="flex-1 py-2 px-3 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
                >
                  Regenerate
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(summary);
                    alert('Summary copied to clipboard!');
                  }}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10"
                >
                  Copy Summary
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;
