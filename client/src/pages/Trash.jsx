import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getFiles, deleteFile, restoreFile } from '../store/fileSlice';
import { getFolders, deleteFolder, restoreFolder } from '../store/folderSlice';
import { File, Folder, Image, FileText, Film, MoreVertical, Trash2, RotateCcw } from 'lucide-react';

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return <Image className="text-blue-500 w-8 h-8" />;
  if (mimeType.startsWith('video/')) return <Film className="text-red-500 w-8 h-8" />;
  return <FileText className="text-gray-500 w-8 h-8" />;
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getDaysRemaining = (deletedAt) => {
  if (!deletedAt) return 0;
  const deletedDate = new Date(deletedAt);
  const expiryDate = new Date(deletedDate);
  expiryDate.setDate(expiryDate.getDate() + 15);
  const now = new Date();
  const diffTime = Math.max(0, expiryDate - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const Trash = () => {
  const { files } = useSelector((state) => state.files);
  const { folders } = useSelector((state) => state.folders);
  const dispatch = useDispatch();
  
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    dispatch(getFiles({ isTrashed: true }));
    dispatch(getFolders({ isTrashed: true }));
  }, [dispatch]);

  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleHardDelete = (e, id, type) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to PERMANENTLY delete this ${type}? This action cannot be undone.`)) {
      if (type === 'file') dispatch(deleteFile(id));
      else dispatch(deleteFolder(id));
    }
    setActiveMenu(null);
  };

  const handleRestore = (e, id, type) => {
    e.stopPropagation();
    if (type === 'file') dispatch(restoreFile(id));
    else dispatch(restoreFolder(id));
    setActiveMenu(null);
  };

  const ActionMenu = ({ item, type }) => (
    <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
      <button onClick={(e) => handleRestore(e, item._id, type)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <RotateCcw className="w-4 h-4 mr-3" /> Restore
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button onClick={(e) => handleHardDelete(e, item._id, type)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
        <Trash2 className="w-4 h-4 mr-3" /> Delete forever
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 px-1">
        <div className="flex items-center text-xl font-medium text-driveText">
          <span>Trash</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 italic">Items in trash are deleted forever after 15 days.</p>
      </div>

      {folders && folders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => {
              const daysLeft = getDaysRemaining(folder.deletedAt);
              return (
              <div 
                key={folder._id} 
                className="bg-white border border-driveBorder rounded-lg p-4 flex flex-col justify-between hover:bg-driveGray transition-colors relative"
              >
                 <div className="flex items-center justify-between w-full mb-2">
                   <div className="flex items-center truncate">
                     <Folder className="text-gray-500 w-6 h-6 mr-3 fill-current flex-shrink-0" />
                     <span className="text-sm font-medium text-driveText truncate">{folder.name}</span>
                   </div>
                   <button 
                     onClick={(e) => toggleMenu(e, folder._id)}
                     className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-200 transition-colors"
                   >
                     <MoreVertical className="w-4 h-4" />
                   </button>
                 </div>
                 <div className="text-xs text-red-500 font-medium">
                   {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
                 </div>
                 {activeMenu === folder._id && <ActionMenu item={folder} type="folder" />}
              </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Files</h2>
        {files.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => {
              const daysLeft = getDaysRemaining(file.deletedAt);
              return (
              <div 
                key={file._id} 
                className="bg-white border border-gray-200 rounded-xl flex flex-col h-60 hover:bg-gray-50 transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white relative">
                  <div className="flex items-center space-x-3 truncate pr-2">
                    {file.mimeType.startsWith('video/') ? (
                      <Film className="w-5 h-5 text-red-500 flex-shrink-0 fill-current" />
                    ) : file.mimeType.startsWith('image/') ? (
                      <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate" title={file.filename}>{file.filename}</span>
                  </div>
                  <button 
                    onClick={(e) => toggleMenu(e, file._id)}
                    className={`text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-100 transition-colors ${activeMenu === file._id ? 'bg-gray-100' : ''}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeMenu === file._id && <ActionMenu item={file} type="file" />}
                </div>
                
                <div className="flex-1 bg-gray-50 p-3">
                  {file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/') ? (
                    <div className="w-full h-full rounded-md overflow-hidden bg-white shadow-sm border border-gray-200 relative group-hover:border-blue-200 transition-colors">
                      {file.mimeType.startsWith('video/') ? (
                         <video src={file.url} className="w-full h-full object-cover" muted preload="metadata" />
                      ) : (
                         <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-md bg-white border border-gray-200 flex flex-col items-center justify-center text-gray-400 shadow-sm group-hover:border-blue-200 transition-colors">
                      {getFileIcon(file.mimeType)}
                      <span className="text-xs mt-3 text-gray-500 font-medium px-2 py-1 bg-gray-50 rounded-full">{formatSize(file.size)}</span>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-red-50 border-t border-red-100 text-center">
                  <span className="text-xs text-red-600 font-medium">{daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining</span>
                </div>
              </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Trash is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trash;
