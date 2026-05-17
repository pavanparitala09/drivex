import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFile } from '../store/fileSlice';
import { X, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UploadModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const { isLoading, currentFolder, isError, message } = useSelector((state) => state.files);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (currentFolder) {
      formData.append('folderId', currentFolder);
    }

    dispatch(uploadFile(formData)).then((action) => {
      if (!action.error) {
        setFile(null);
        onClose();
        navigate('/');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-driveBorder">
          <h2 className="text-lg font-medium text-driveText">Upload File</h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isError && (
          <div className="mx-4 mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {message || 'Upload failed. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-12 h-12 text-driveBlue mb-4" />
            {file ? (
              <p className="text-sm font-medium text-driveText">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-driveText mb-1">Click or drag file to this area to upload</p>
                <p className="text-xs text-gray-500">Support for a single upload. Strictly prohibit from uploading company data or other band files</p>
              </>
            )}
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-driveText hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !file}
              className="px-4 py-2 bg-driveBlue text-white rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
