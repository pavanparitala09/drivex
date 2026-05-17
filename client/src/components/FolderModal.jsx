import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createFolder } from '../store/folderSlice';
import { X } from 'lucide-react';

const FolderModal = ({ isOpen, onClose }) => {
  const [folderName, setFolderName] = useState('');
  const dispatch = useDispatch();
  const { currentFolder } = useSelector((state) => state.files);
  const { isLoading } = useSelector((state) => state.folders);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    dispatch(createFolder({
      name: folderName,
      parentFolder: currentFolder
    })).then((action) => {
      if (!action.error) {
        setFolderName('');
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-4">
          <h2 className="text-lg font-medium text-driveText mb-4">New folder</h2>
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-6"
            />

            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm font-medium text-driveBlue hover:bg-gray-100 focus:outline-none"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading || !folderName.trim()}
                className="px-4 py-2 rounded-md text-sm font-medium text-driveBlue hover:bg-gray-100 focus:outline-none disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FolderModal;
