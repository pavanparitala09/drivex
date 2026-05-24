import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getFiles, deleteFile, toggleStarFile } from '../store/fileSlice';
import { getFolders, deleteFolder, updateFolder, toggleStarFolder } from '../store/folderSlice';
import { File, Folder, Image, FileText, Film, Trash2, Edit, Share2, Info, Star, Palette, Tag, Sparkles, MoreVertical } from 'lucide-react';
import FilePreviewModal from '../components/FilePreviewModal';
import RenameModal from '../components/RenameModal';
import ShareLinkModal from '../components/ShareLinkModal';
import api from '../utils/axios';

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return <Image className="text-blue-500 w-8 h-8" />;
  if (mimeType.startsWith('video/')) return <Film className="text-red-500 w-8 h-8" />;
  return <FileText className="text-indigo-500 w-8 h-8" />;
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const standardTags = [
  { name: 'High Priority', label: '🔴 High', color: '#ef4444' },
  { name: 'Work', label: '🔵 Work', color: '#3b82f6' },
  { name: 'Receipts', label: '🟢 Receipts', color: '#10b981' },
  { name: 'Personal', label: '🟡 Personal', color: '#f59e0b' }
];

const TaggedFiles = () => {
  const { tagName } = useParams();
  const { files } = useSelector((state) => state.files);
  const { folders } = useSelector((state) => state.folders);
  const dispatch = useDispatch();

  const [contextMenu, setContextMenu] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const [renameType, setRenameType] = useState(null);
  const [shareItem, setShareItem] = useState(null);

  // Custom UI Modals & Toast states
  const [toast, setToast] = useState(null);
  const [customConfirm, setCustomConfirm] = useState(null);
  const [aiRenameLoading, setAiRenameLoading] = useState(false);
  const [aiRenameFile, setAiRenameFile] = useState(null);
  const [suggestedName, setSuggestedName] = useState('');
  const [showRenameSuggestion, setShowRenameSuggestion] = useState(false);
  const [aiRenameStep, setAiRenameStep] = useState(0);
  const [successPopup, setSuccessPopup] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // AI Rename loader step updates
  useEffect(() => {
    let interval;
    if (aiRenameLoading) {
      setAiRenameStep(0);
      interval = setInterval(() => {
        setAiRenameStep(prev => (prev < 2 ? prev + 1 : prev));
      }, 1500);
    } else {
      setAiRenameStep(0);
    }
    return () => clearInterval(interval);
  }, [aiRenameLoading]);

  const fetchTaggedData = () => {
    dispatch(getFiles({ tag: tagName }));
    dispatch(getFolders({ tag: tagName }));
  };

  useEffect(() => {
    fetchTaggedData();
  }, [dispatch, tagName]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (window.innerWidth - x < 250) x -= 250;
    if (window.innerHeight - y < 450) y -= 450;

    setContextMenu({
      mouseX: x,
      mouseY: y,
      item,
      type
    });
  };

  const handleDelete = (id, type) => {
    setCustomConfirm({
      title: `Delete ${type === 'file' ? 'File' : 'Folder'}`,
      message: `Are you sure you want to move this ${type} to trash?`,
      onConfirm: () => {
        if (type === 'file') {
          dispatch(deleteFile(id)).then(() => fetchTaggedData());
        } else {
          dispatch(deleteFolder(id)).then(() => fetchTaggedData());
        }
        setToast({ type: 'success', message: `${type === 'file' ? 'File' : 'Folder'} moved to trash` });
      }
    });
    setContextMenu(null);
  };

  const handleStar = (id, type) => {
    if (type === 'file') dispatch(toggleStarFile(id));
    else dispatch(toggleStarFolder(id));
    setContextMenu(null);
  };

  const handleTagToggle = async (id, type, name, color) => {
    try {
      if (type === 'file') {
        await api.patch(`/files/${id}/tags`, { name, color });
      } else {
        await api.patch(`/folders/${id}/tags`, { name, color });
      }
      fetchTaggedData();
      setContextMenu(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIRename = async (file) => {
    setContextMenu(null);
    setAiRenameLoading(true);
    setAiRenameFile(file);

    try {
      const res = await api.get(`/files/${file._id}/suggest-name`);
      setAiRenameLoading(false);
      if (res.data.success) {
        const suggested = res.data.suggestedName;
        if (!suggested || suggested === file.filename) {
          setToast({ type: 'success', message: 'AI suggestion: Current name is optimal.' });
          setAiRenameFile(null);
          return;
        }
        setSuggestedName(suggested);
        setShowRenameSuggestion(true);
      }
    } catch (err) {
      setAiRenameLoading(false);
      setAiRenameFile(null);
      setToast({ type: 'error', message: err.response?.data?.message || 'AI rename failed' });
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300" onContextMenu={(e) => {
        if (e.target === e.currentTarget) setContextMenu(null);
    }}>
      <div className="flex items-center text-xl font-semibold text-slate-800 mb-8 px-2">
        <span className="text-slate-400 font-medium mr-2">Tag:</span>
        <span className="px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          {tagName}
        </span>
      </div>

      {/* Folders Section */}
      {folders && folders.length > 0 && (
        <div className="mb-10 px-2">
          <h2 className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-wider">Folders</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {folders.map((folder) => (
              <div 
                key={folder._id} 
                onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center hover:shadow-lg hover:border-indigo-100 cursor-pointer transition-all hover:-translate-y-1 relative group"
                style={{
                  background: folder.color ? `linear-gradient(135deg, ${folder.color}11 0%, ${folder.color}33 100%)` : undefined,
                  borderColor: folder.color ? `${folder.color}55` : undefined
                }}
              >
                 <Folder 
                    className="w-12 h-12 mb-3 transition-transform group-hover:scale-110" 
                    style={{ fill: folder.color || '#94a3b8', color: folder.color || '#94a3b8' }} 
                 />
                 <span className="text-sm font-medium text-slate-700 truncate w-full text-center">{folder.name}</span>
                 {folder.isStarred && <Star className="w-4 h-4 fill-amber-400 text-amber-400 absolute top-3 left-3" />}
                 
                 {/* Three-dots menu button for actions */}
                 <button
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     handleContextMenu(e, folder, 'folder');
                   }}
                   className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/60 transition-colors lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer z-10"
                   title="Actions"
                 >
                   <MoreVertical className="w-4 h-4" />
                 </button>

                 {/* Render tag color dots */}
                 {folder.tags && folder.tags.length > 0 && (
                   <div className="absolute bottom-2 right-2 flex gap-1">
                     {folder.tags.map(t => (
                       <span key={t.name} className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} title={t.name} />
                     ))}
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="mb-8 px-2 flex-1">
        <h2 className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-wider">Files</h2>
        {files && files.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {files.map((file) => (
              <div 
                key={file._id} 
                onClick={() => {
                  const isText = file.mimeType.startsWith('text/') || 
                                 file.filename.endsWith('.md') || 
                                 file.filename.endsWith('.json') || 
                                 file.filename.endsWith('.js') || 
                                 file.filename.endsWith('.html') || 
                                 file.filename.endsWith('.css');
                  const isPDF = file.mimeType === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
                  if (file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/') || isText || isPDF) {
                    setPreviewFile(file);
                  } else {
                    window.open(file.url, '_blank');
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, file, 'file')}
                className="bg-white border border-slate-100 rounded-2xl flex flex-col h-52 cursor-pointer overflow-hidden transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 relative"
              >
                {/* Body/Thumbnail */}
                <div className="flex-1 bg-slate-50 relative overflow-hidden">
                  {file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/') ? (
                    <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-500">
                      {file.mimeType.startsWith('video/') ? (
                         <video src={file.url} className="w-full h-full object-cover" muted preload="metadata" />
                      ) : (
                         <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                      {getFileIcon(file.mimeType)}
                    </div>
                  )}
                  {file.isStarred && <Star className="w-5 h-5 fill-amber-400 text-amber-400 absolute top-3 right-3 drop-shadow-md" />}
                  
                  {/* Render tag color dots */}
                  {file.tags && file.tags.length > 0 && (
                    <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                      {file.tags.map(t => (
                        <span key={t.name} className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: t.color }} title={t.name} />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Header/Footer */}
                <div className="flex items-center justify-between p-4 bg-white border-t border-slate-50 z-10 w-full min-w-0">
                  <div className="flex flex-col truncate pr-2 flex-1">
                    <span className="text-sm font-semibold text-slate-800 truncate" title={file.filename}>{file.filename}</span>
                    <span className="text-xs mt-0.5 text-slate-400 font-medium">{formatSize(file.size)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleContextMenu(e, file, 'file');
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 cursor-pointer"
                    title="Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
            <p className="text-slate-400 font-medium text-lg">No files with this tag.</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }} 
          className="fixed z-50 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100/80 py-2 animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-slate-100 mb-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{contextMenu.item.name || contextMenu.item.filename}</p>
          </div>
          
          <button onClick={() => handleStar(contextMenu.item._id, contextMenu.type)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center transition-colors">
            <Star className={`w-4 h-4 mr-3 ${contextMenu.item.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} /> {contextMenu.item.isStarred ? 'Remove from Starred' : 'Add to Starred'}
          </button>
          
          <button onClick={() => { setRenameItem(contextMenu.item); setRenameType(contextMenu.type); setContextMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center transition-colors">
            <Edit className="w-4 h-4 mr-3 text-slate-400" /> Rename
          </button>
          
          {contextMenu.type === 'file' && (
            <button onClick={() => handleAIRename(contextMenu.item)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center transition-colors">
              <Sparkles className="w-4 h-4 mr-3 text-indigo-500 animate-pulse" /> AI Auto Rename
            </button>
          )}
          
          <button onClick={() => { setShareItem(contextMenu.item); setContextMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center transition-colors">
            <Share2 className="w-4 h-4 mr-3 text-slate-400" /> Get public link
          </button>

          {/* Tags Configuration in Context Menu */}
          <div className="px-4 py-2.5 border-t border-slate-100 mt-1">
            <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
               <Tag className="w-3.5 h-3.5 mr-2" /> Toggle Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
               {standardTags.map(tag => {
                 const hasTag = contextMenu.item.tags?.some(t => t.name === tag.name);
                 return (
                   <span 
                     key={tag.name} 
                     onClick={() => handleTagToggle(contextMenu.item._id, contextMenu.type, tag.name, tag.color)}
                     className={`text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-all border font-bold ${
                       hasTag 
                         ? 'border-transparent text-white' 
                         : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                     }`}
                     style={{ backgroundColor: hasTag ? tag.color : undefined }}
                   >
                     {tag.label.split(' ')[1] || tag.label}
                   </span>
                 );
               })}
            </div>
          </div>

          <div className="border-t border-slate-100 my-1"></div>
          
          <button onClick={() => handleDelete(contextMenu.item._id, contextMenu.type)} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center transition-colors font-medium">
            <Trash2 className="w-4 h-4 mr-3 text-rose-500" /> Delete
          </button>
        </div>
      )}

      <FilePreviewModal 
        file={previewFile} 
        isOpen={!!previewFile} 
        onClose={() => setPreviewFile(null)} 
      />

      <RenameModal 
        isOpen={!!renameItem} 
        onClose={() => { setRenameItem(null); setRenameType(null); fetchTaggedData(); }}
        item={renameItem}
        type={renameType}
      />

      <ShareLinkModal 
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        file={shareItem}
      />

      {/* AI Suggestion Modal */}
      {showRenameSuggestion && aiRenameFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">AI Suggested Rename</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Edit or confirm the suggested filename</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Original Name</span>
                <p className="text-xs font-semibold text-slate-600 truncate">{aiRenameFile.filename}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Suggested Name</label>
                <input 
                  type="text"
                  value={suggestedName}
                  onChange={(e) => setSuggestedName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => { setShowRenameSuggestion(false); setAiRenameFile(null); }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!suggestedName.trim()) return;
                  const oldName = aiRenameFile.filename;
                  try {
                    await api.patch(`/files/${aiRenameFile._id}`, { filename: suggestedName });
                    setShowRenameSuggestion(false);
                    setAiRenameFile(null);
                    setSuccessPopup({
                      title: 'File Renamed Successfully',
                      message: 'AI suggested rename has been applied to your file.',
                      oldName: oldName,
                      newName: suggestedName,
                      type: 'rename'
                    });
                    fetchTaggedData();
                  } catch (err) {
                    setToast({ type: 'error', message: err.response?.data?.message || 'Failed to rename' });
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Apply Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestion Loader */}
      {aiRenameLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <style>{`
            @keyframes scan {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(80px); }
            }
            .animate-scan {
              animation: scan 2s ease-in-out infinite;
            }
            @keyframes rotate-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-rotate-slow {
              animation: rotate-slow 6s linear infinite;
            }
          `}</style>
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xl max-w-sm w-full text-center space-y-6 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-b-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-transparent border-r-indigo-400 border-l-purple-400 rounded-full animate-rotate-slow opacity-80" />
              <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 p-4 rounded-full shadow-inner">
                <Sparkles className="w-8 h-8 animate-pulse text-indigo-600" />
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan shadow-[0_0_10px_#6366f1]" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-slate-800">AI File Renaming Analyzer</h4>
              <div className="h-10 flex items-center justify-center">
                <p className="text-xs font-semibold text-slate-500 transition-all duration-300 animate-pulse">
                  {aiRenameStep === 0 && "🔍 Extracting file metadata & structure..."}
                  {aiRenameStep === 1 && "🧠 Feeding content slices to Gemini model..."}
                  {aiRenameStep === 2 && "✨ Engineering optimized file naming suggestion..."}
                </p>
              </div>
              <div className="flex justify-center gap-1.5 pt-1">
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${aiRenameStep >= 0 ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${aiRenameStep >= 1 ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${aiRenameStep >= 2 ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup Modal */}
      {successPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" />
              <div className="relative bg-emerald-500/20 text-emerald-600 p-4 rounded-full">
                <Sparkles className="w-8 h-8 animate-bounce text-emerald-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-800">{successPopup.title}</h3>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">{successPopup.message}</p>
            </div>

            {successPopup.oldName && successPopup.newName && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 text-left">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Before</span>
                  <p className="text-xs font-bold text-slate-500 line-through truncate mt-0.5">{successPopup.oldName}</p>
                </div>
                <div className="border-t border-slate-100/80 pt-2">
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">After</span>
                  <p className="text-xs font-bold text-indigo-600 truncate mt-0.5">{successPopup.newName}</p>
                </div>
              </div>
            )}

            <button 
              onClick={() => setSuccessPopup(null)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Looks Great!
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {customConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-250">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-extrabold text-slate-800">{customConfirm.title}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">{customConfirm.message}</p>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setCustomConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  customConfirm.onConfirm();
                  setCustomConfirm(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white shadow-lg shadow-rose-100 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast System Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-5 fade-in duration-300">
          {toast.type === 'success' ? (
            <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">✔</span>
          ) : (
            <span className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">✖</span>
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default TaggedFiles;
