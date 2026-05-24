import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getSharedFiles } from '../store/shareSlice';
import { File, Folder, Image, FileText, Film, User } from 'lucide-react';

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return <Image className="text-blue-500 w-8 h-8" />;
  if (mimeType.startsWith('video/')) return <Film className="text-red-500 w-8 h-8" />;
  return <FileText className="text-gray-500 w-8 h-8" />;
};

const SharedFiles = () => {
  const { sharedFiles, isLoading } = useSelector((state) => state.share);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getSharedFiles());
  }, [dispatch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-driveText">Shared with me</h1>
      </div>

      <div className="mb-8">
        {isLoading ? (
          <p>Loading files...</p>
        ) : sharedFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sharedFiles.map((file) => (
              <div 
                key={file._id} 
                onClick={() => window.open(file.url, '_blank')}
                className="bg-white border border-driveBorder rounded-lg p-4 flex flex-col justify-between h-40 hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {file.mimeType.startsWith('image/') ? (
                    <img 
                      src={file.url} 
                      alt={file.filename} 
                      className="w-16 h-16 object-cover rounded" 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/64?text=Error'; // fallback image
                      }}
                    />
                  ) : (
                    getFileIcon(file.mimeType)
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-driveText truncate" title={file.filename}>{file.filename}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {file.userId?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No files have been shared with you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedFiles;
