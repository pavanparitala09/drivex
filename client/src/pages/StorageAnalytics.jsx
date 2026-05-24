import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, AlertTriangle, Disc, RefreshCw, HardDrive, CheckCircle } from 'lucide-react';
import api from '../utils/axios';
import { deleteFile } from '../store/fileSlice';

const formatSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StorageAnalytics = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [breakdown, setBreakdown] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('large');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [breakdownRes, suggestionsRes] = await Promise.all([
        api.get('/files/storage-breakdown'),
        api.get('/files/cleanup-suggestions')
      ]);
      setBreakdown(breakdownRes.data.data);
      setSuggestions(suggestionsRes.data.data);
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await dispatch(deleteFile(id)).unwrap();
        // Refresh suggestions and breakdown
        fetchData();
      } catch (err) {
        alert(err || 'Failed to delete file');
      }
    }
  };

  if (isLoading && !breakdown) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Loading Storage Insights...</span>
        </div>
      </div>
    );
  }

  // Calculate totals and percentages
  const maxStorage = 500 * 1024 * 1024; // 500MB
  const totalUsed = user?.storageUsed || 0;
  const usedPercentage = Math.min((totalUsed / maxStorage) * 100, 100).toFixed(1);

  const categories = [
    { name: 'Images', value: breakdown?.images || 0, color: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Videos', value: breakdown?.videos || 0, color: '#ef4444', bg: 'bg-red-500' },
    { name: 'PDFs', value: breakdown?.pdfs || 0, color: '#f59e0b', bg: 'bg-amber-500' },
    { name: 'Documents', value: breakdown?.documents || 0, color: '#10b981', bg: 'bg-emerald-500' },
    { name: 'Others', value: breakdown?.others || 0, color: '#8b5cf6', bg: 'bg-violet-500' }
  ].filter(c => c.value > 0);

  // SVG parameters for Doughnut chart
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const chartSegments = categories.map((cat) => {
    const percentage = cat.value / (totalUsed || 1);
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = currentOffset;
    currentOffset -= percentage * circumference;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Storage Insights</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Detailed visualization of your usage and cleanup recommendations</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-slate-600 hover:text-indigo-600 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Doughnut Chart Panel */}
        <div className="lg:col-span-1 bg-white border border-slate-100/80 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 text-center w-full">Storage Breakdown</h2>
          
          <div className="relative w-[200px] h-[200px]">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-slate-100 fill-none"
                strokeWidth={strokeWidth}
              />
              {/* Colored segment circles */}
              {totalUsed > 0 && chartSegments.map((seg, index) => (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  className="fill-none transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  stroke={seg.color}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                />
              ))}
            </svg>
            
            {/* Centered label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-800">{usedPercentage}%</span>
              <span className="text-xs font-bold text-slate-400 mt-0.5">USED</span>
            </div>
          </div>

          <div className="mt-8 space-y-4 w-full">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2 border-b border-slate-50 pb-2">
              <span>Category</span>
              <span>Size</span>
            </div>
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No storage used yet.</p>
            ) : (
              categories.map((cat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full ${cat.bg}`} />
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-slate-500">{formatSize(cat.value)}</span>
                </div>
              ))
            )}
            <div className="border-t border-slate-50 pt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4.5 h-4.5 text-slate-400" />
                <span className="font-bold text-slate-800">Total Used</span>
              </div>
              <span className="font-bold text-slate-800">{formatSize(totalUsed)} / 500 MB</span>
            </div>
          </div>
        </div>

        {/* Cleanup Suggestions Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-100/80 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Smart Cleanup Suggestions</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 mb-6 gap-6">
            <button
              onClick={() => setActiveTab('large')}
              className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'large' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Large Files ({suggestions?.largeFiles?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'duplicates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Duplicates ({suggestions?.duplicateFiles?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('old')}
              className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'old' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Old Unused ({suggestions?.oldFiles?.length || 0})
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1">
            {activeTab === 'large' && (
              <div className="space-y-4">
                {(!suggestions?.largeFiles || suggestions.largeFiles.length === 0) ? (
                  <EmptyState message="No large files found (>15MB)." />
                ) : (
                  suggestions.largeFiles.map(file => (
                    <FileCleanupRow key={file._id} file={file} onDelete={handleDelete} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'duplicates' && (
              <div className="space-y-4">
                {(!suggestions?.duplicateFiles || suggestions.duplicateFiles.length === 0) ? (
                  <EmptyState message="No duplicate files found." />
                ) : (
                  suggestions.duplicateFiles.map(file => (
                    <FileCleanupRow 
                      key={file._id} 
                      file={file} 
                      onDelete={handleDelete} 
                      label={`Duplicate of "${file.originalName}"`} 
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'old' && (
              <div className="space-y-4">
                {(!suggestions?.oldFiles || suggestions.oldFiles.length === 0) ? (
                  <EmptyState message="No files older than 30 days." />
                ) : (
                  suggestions.oldFiles.map(file => (
                    <FileCleanupRow 
                      key={file._id} 
                      file={file} 
                      onDelete={handleDelete} 
                      label={`Uploaded on ${new Date(file.createdAt).toLocaleDateString()}`} 
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const FileCleanupRow = ({ file, onDelete, label }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors">
      <div className="flex flex-col min-w-0 pr-4">
        <span className="text-sm font-semibold text-slate-800 truncate" title={file.filename}>
          {file.filename}
        </span>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs font-bold text-slate-400">{formatSize(file.size)}</span>
          {label && (
            <>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">{label}</span>
            </>
          )}
        </div>
      </div>
      <button 
        onClick={() => onDelete(file._id, file.filename)}
        className="p-2.5 bg-white text-rose-500 hover:bg-rose-50 border border-slate-100 rounded-xl hover:border-rose-100 transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center justify-center"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const EmptyState = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
      <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
      <p className="text-slate-600 font-semibold text-sm">{message}</p>
      <p className="text-xs text-slate-400 mt-1">Keep up the good work!</p>
    </div>
  );
};

export default StorageAnalytics;
