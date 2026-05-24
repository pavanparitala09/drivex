import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateFile } from '../store/fileSlice';
import { updateFolder } from '../store/folderSlice';
import { X, Edit2 } from 'lucide-react';

const RenameModal = ({ isOpen, onClose, item, type }) => {
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (item) {
      setNewName(type === 'file' ? item.filename : item.name);
    }
  }, [item, type, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    // Check if name has actually changed
    const currentName = type === 'file' ? item.filename : item.name;
    if (newName.trim() === currentName) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === 'file') {
        await dispatch(updateFile({ id: item._id, filename: newName.trim() })).unwrap();
      } else {
        await dispatch(updateFolder({ id: item._id, name: newName.trim() })).unwrap();
      }
      onClose();
    } catch (err) {
      alert(err || 'Failed to rename item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white/95 border border-slate-100/80 rounded-3xl shadow-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
            <Edit2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Rename {type === 'file' ? 'File' : 'Folder'}</h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Choose a new name for your item</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Enter new ${type} name`}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-2xl py-3 px-4 outline-none transition-all text-slate-700 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
