import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getFiles, setCurrentFolder, deleteFile, updateFile, toggleStarFile } from '../store/fileSlice';
import { getFolders, deleteFolder, updateFolder, toggleStarFolder } from '../store/folderSlice';
import { File, Folder, Image, FileText, Film, ChevronRight, MoreVertical, Trash2, Edit, Share2, Info, Star } from 'lucide-react';

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

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { files, currentFolder } = useSelector((state) => state.files);
  const { folders } = useSelector((state) => state.folders);
  const dispatch = useDispatch();
  
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Drive' }]);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleDelete = (e, id, type) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'file') dispatch(deleteFile(id));
      else dispatch(deleteFolder(id));
    }
    setActiveMenu(null);
  };

  const handleStar = (e, id, type) => {
    e.stopPropagation();
    if (type === 'file') dispatch(toggleStarFile(id));
    else dispatch(toggleStarFolder(id));
    setActiveMenu(null);
  };

  const handleAction = (e, actionName) => {
    e.stopPropagation();
    alert(`${actionName} functionality coming soon!`);
    setActiveMenu(null);
  };

  const ActionMenu = ({ item, type }) => (
    <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
      <button onClick={(e) => handleStar(e, item._id, type)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Star className={`w-4 h-4 mr-3 ${item.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} /> {item.isStarred ? 'Remove from Starred' : 'Add to Starred'}
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button onClick={(e) => handleAction(e, 'Rename')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Edit className="w-4 h-4 mr-3" /> Rename
      </button>
      <button onClick={(e) => handleAction(e, 'Share')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Share2 className="w-4 h-4 mr-3" /> Share
      </button>
      <button onClick={(e) => handleAction(e, 'Information')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Info className="w-4 h-4 mr-3" /> Information
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button onClick={(e) => handleDelete(e, item._id, type)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
        <Trash2 className="w-4 h-4 mr-3" /> Delete
      </button>
    </div>
  );

  useEffect(() => {
    dispatch(getFiles({ folderId: currentFolder }));
    dispatch(getFolders(currentFolder));
  }, [dispatch, currentFolder]);

  const handleFolderClick = (folder) => {
    dispatch(setCurrentFolder(folder._id));
    setBreadcrumbs(prev => {
      if (prev.length > 0 && prev[prev.length - 1].id === folder._id) return prev;
      return [...prev, { id: folder._id, name: folder.name }];
    });
  };

  const handleBreadcrumbClick = (crumb, index) => {
    dispatch(setCurrentFolder(crumb.id));
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center text-xl font-medium text-driveText mb-6">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.id || 'root'}-${index}`}>
            <span 
              className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${index === breadcrumbs.length - 1 ? 'text-driveText' : 'text-gray-500'}`}
              onClick={() => handleBreadcrumbClick(crumb, index)}
            >
              {crumb.name}
            </span>
            {index < breadcrumbs.length - 1 && <ChevronRight className="w-5 h-5 mx-1 text-gray-400" />}
          </React.Fragment>
        ))}
      </div>

      {/* Folders Section */}
      {folders && folders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div 
                key={folder._id} 
                onDoubleClick={() => handleFolderClick(folder)}
                className="bg-white border border-driveBorder rounded-lg p-4 flex items-center justify-between hover:bg-driveGray cursor-pointer transition-colors relative"
              >
                 <div className="flex items-center truncate">
                   <Folder className="text-gray-500 w-6 h-6 mr-3 fill-current flex-shrink-0" />
                   <span className="text-sm font-medium text-driveText truncate mr-2">{folder.name}</span>
                   {folder.isStarred && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                 </div>
                 <button 
                   onClick={(e) => toggleMenu(e, folder._id)}
                   className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-200 transition-colors"
                 >
                   <MoreVertical className="w-4 h-4" />
                 </button>
                 {activeMenu === folder._id && <ActionMenu item={folder} type="folder" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Files</h2>
        {files.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div 
                key={file._id} 
                onDoubleClick={() => window.open(file.url, '_blank')}
                className="bg-white border border-gray-200 rounded-xl flex flex-col h-56 hover:bg-gray-50 cursor-pointer overflow-hidden transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white relative">
                  <div className="flex items-center space-x-3 truncate pr-2">
                    {/* Small icon based on type */}
                    {file.mimeType.startsWith('video/') ? (
                      <Film className="w-5 h-5 text-red-500 flex-shrink-0 fill-current" />
                    ) : file.mimeType.startsWith('image/') ? (
                      <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate" title={file.filename}>{file.filename}</span>
                    {file.isStarred && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0 ml-1" />}
                  </div>
                  <button 
                    onClick={(e) => toggleMenu(e, file._id)}
                    className={`text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-100 transition-colors ${activeMenu === file._id ? 'bg-gray-100' : ''}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeMenu === file._id && <ActionMenu item={file} type="file" />}
                </div>
                
                {/* Body/Thumbnail */}
                <div className="flex-1 bg-gray-50 p-3">
                  {file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/') ? (
                    <div className="w-full h-full rounded-md overflow-hidden bg-white shadow-sm border border-gray-200 relative group-hover:border-blue-200 transition-colors">
                      {file.mimeType.startsWith('video/') ? (
                         <video src={file.url} className="w-full h-full object-cover" muted preload="metadata" />
                      ) : (
                         <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                      )}
                      {/* Play button overlay for video */}
                      {file.mimeType.startsWith('video/') && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 group-hover:bg-opacity-20 transition-all">
                           <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                             <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-t-transparent border-b-transparent border-l-gray-800 ml-1"></div>
                           </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-md bg-white border border-gray-200 flex flex-col items-center justify-center text-gray-400 shadow-sm group-hover:border-blue-200 transition-colors">
                      {getFileIcon(file.mimeType)}
                      <span className="text-xs mt-3 text-gray-500 font-medium px-2 py-1 bg-gray-50 rounded-full">{formatSize(file.size)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No files in this folder.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
