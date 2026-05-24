import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getFiles } from '../store/fileSlice';
import { ArrowLeft, Save, FileText, Eye, Edit3, Columns, Info, Check, RefreshCw } from 'lucide-react';
import api from '../utils/axios';

const parseMarkdown = (md) => {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Code blocks: ```\ncode\n```
  html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
    return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-2xl my-4 overflow-x-auto font-mono text-xs leading-relaxed"><code>${p1.trim()}</code></pre>`;
  });

  // Headers
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-extrabold text-slate-900 mt-6 mb-4 border-b border-slate-100 pb-2">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold text-slate-800 mt-5 mb-3">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold text-slate-700 mt-4 mb-2">$1</h3>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-lg font-mono text-xs">$1</code>');

  // Blockquotes
  html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 my-3 text-slate-600 italic bg-indigo-50/30 rounded-r-lg">$1</blockquote>');

  // Lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li class="list-disc ml-6 my-1.5 text-slate-700">$1</li>');
  html = html.replace(/^\s*\*\s+(.*?)$/gm, '<li class="list-disc ml-6 my-1.5 text-slate-700">$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="list-decimal ml-6 my-1.5 text-slate-700">$1</li>');

  // Paragraphs
  html = html.replace(/^(?!<h|<pre|<code|<blockquote|<li)(.*?)$/gm, (match, p1) => {
    if (p1.trim() === '') return '';
    return `<p class="my-3 text-slate-600 leading-relaxed">${p1}</p>`;
  });

  return html;
};

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { files } = useSelector((state) => state.files);

  const [filename, setFilename] = useState('untitled.md');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'editor', 'preview'

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  useEffect(() => {
    if (id && id !== 'new') {
      const loadFile = async () => {
        setLoading(true);
        try {
          let currentFile = files.find(f => f._id === id);
          if (!currentFile) {
            const list = await dispatch(getFiles()).unwrap();
            currentFile = list.find(f => f._id === id);
          }
          
          if (currentFile) {
            setFilename(currentFile.filename);
            const contentRes = await api.get(`/files/${currentFile._id}/view`);
            setContent(typeof contentRes.data === 'string' ? contentRes.data : JSON.stringify(contentRes.data, null, 2));
          } else {
            alert('Document not found');
            navigate('/');
          }
        } catch (err) {
          console.error(err);
          alert('Failed to load document content');
        } finally {
          setLoading(false);
        }
      };
      loadFile();
    }
  }, [id, dispatch]);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = content.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleSave = async () => {
    if (!filename.trim()) {
      alert('Please enter a valid filename.');
      return;
    }

    setSaving(true);
    try {
      if (id === 'new') {
        const res = await api.post('/files/text', {
          filename,
          content
        });
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          navigate('/');
        }, 1500);
      } else {
        await api.put(`/files/${id}/content`, {
          content
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Loading Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* Top Workspace Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            {id === 'new' ? (
              <input 
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Filename (e.g. notes.md)"
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none text-sm font-bold text-slate-800 focus:border-indigo-500 w-64 shadow-sm"
              />
            ) : (
              <span className="text-sm font-bold text-slate-800">{filename}</span>
            )}
          </div>
        </div>

        {/* View Mode Controllers */}
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 shadow-inner">
            <button 
              onClick={() => setViewMode('editor')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Editor
            </button>
            <button 
              onClick={() => setViewMode('split')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'split' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Split
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
              saveSuccess 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Content Panes */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane - Code/Markdown Textarea */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className="flex-1 flex overflow-hidden border-r border-slate-100">
            {/* Line numbers bar */}
            <div 
              ref={lineNumbersRef}
              className="w-12 bg-slate-50 border-r border-slate-100 py-4 font-mono text-[11px] text-slate-300 text-right pr-3 overflow-hidden select-none"
            >
              {lineNumbers.map(num => (
                <div key={num} className="h-[21px] leading-[21px]">
                  {num}
                </div>
              ))}
            </div>
            
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onScroll={handleScroll}
              placeholder="Start typing markdown here... (e.g. # Document Title)"
              className="flex-1 resize-none p-4 font-mono text-[13px] leading-[21px] text-slate-700 placeholder-slate-300 outline-none overflow-y-auto"
            />
          </div>
        )}

        {/* Right Pane - Rich Live Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 bg-slate-50/50 p-8 overflow-y-auto prose max-w-none">
            <div 
              className="bg-white rounded-2xl border border-slate-100 p-8 min-h-full shadow-sm"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) || '<p class="text-slate-300 italic text-sm">Nothing to preview yet.</p>' }}
            />
          </div>
        )}

      </div>
      
      {/* Help Syntax footer helper */}
      <div className="bg-slate-50 border-t border-slate-100 px-6 py-2 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-indigo-500" /> Markdown Supported</span>
          <span># H1</span>
          <span>## H2</span>
          <span>**Bold**</span>
          <span>*Italic*</span>
          <span>`Code`</span>
          <span>- Bullet List</span>
        </div>
        <div>
          <span>Lines: {lineCount}</span>
        </div>
      </div>

    </div>
  );
};

export default DocumentEditor;
