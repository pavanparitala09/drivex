import React, { useState } from 'react';
import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../store/authSlice';
import { HardDrive, LogOut, Settings, FolderOpen, Clock, Star, Trash2, FolderPlus, Upload, ChevronDown, Cloud } from 'lucide-react';
import UploadModal from './UploadModal';
import FolderModal from './FolderModal';

export const ProtectedLayout = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  const MAX_STORAGE = 500 * 1024 * 1024; // 500 MB
  const storageUsed = user?.storageUsed || 0;
  const storagePercentage = Math.min((storageUsed / MAX_STORAGE) * 100, 100).toFixed(0);
  const storageUsedFormatted = (storageUsed / (1024 * 1024)).toFixed(2) + ' MB';
  const maxStorageFormatted = '500 MB';

  return (
    <div className="flex h-screen bg-driveGray">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-driveBorder flex flex-col">
        <div className="p-4 flex items-center space-x-2">
          <HardDrive className="text-driveBlue w-8 h-8" />
          <span className="text-xl font-medium text-driveText">DriveX</span>
        </div>
        
        <div className="px-3 mt-4 relative">
          <button 
            onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            className="bg-white border hover:bg-driveGray text-driveText font-medium py-3 px-6 rounded-full shadow-sm flex items-center transition-colors"
          >
            <span className="text-3xl font-light mr-2 leading-none">+</span> New
          </button>
          
          {isNewMenuOpen && (
            <div className="absolute top-16 left-3 w-56 bg-white rounded-md shadow-lg border border-driveBorder py-2 z-10">
              <button 
                onClick={() => { setIsFolderModalOpen(true); setIsNewMenuOpen(false); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm"
              >
                <FolderPlus className="w-5 h-5 mr-3 text-gray-500" /> New folder
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={() => { setIsUploadModalOpen(true); setIsNewMenuOpen(false); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm"
              >
                <Upload className="w-5 h-5 mr-3 text-gray-500" /> File upload
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 mt-6 px-2 space-y-1">
          <Link to="/" className="flex items-center px-4 py-2 text-sm font-medium rounded-r-full bg-driveLightBlue text-driveBlue">
            <FolderOpen className="mr-3 w-5 h-5" />
            My Drive
          </Link>
          <Link to="/shared" className="flex items-center px-4 py-2 text-sm font-medium rounded-r-full hover:bg-driveGray text-driveText">
            <Clock className="mr-3 w-5 h-5" />
            Shared with me
          </Link>
          <Link to="/starred" className="flex items-center px-4 py-2 text-sm font-medium rounded-r-full hover:bg-driveGray text-driveText">
            <Star className="mr-3 w-5 h-5" />
            Starred
          </Link>
          <Link to="/trash" className="flex items-center px-4 py-2 text-sm font-medium rounded-r-full hover:bg-driveGray text-driveText transition-colors duration-200">
            <Trash2 className="mr-3 w-5 h-5" />
            Trash
          </Link>
        </nav>

        <div className="px-6 py-4">
          <div className="flex items-center text-sm text-driveText mb-3">
            <Cloud className="w-5 h-5 mr-3 text-gray-500" />
            <span>Storage ({storagePercentage}% full)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 75 ? 'bg-yellow-500' : 'bg-driveBlue'}`} style={{ width: `${storagePercentage}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mb-3">{storageUsedFormatted} of {maxStorageFormatted} used</p>
          <button className="w-full py-2 border border-gray-300 rounded-full text-driveBlue text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm">
            Get more storage
          </button>
        </div>

        <div className="p-4 border-t border-driveBorder">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-driveBlue text-white flex items-center justify-center font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-driveText truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="mr-2 w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-driveBorder flex items-center justify-between px-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search in DriveX" 
                className="w-full bg-driveGray border-transparent focus:bg-white focus:border-driveBlue focus:ring-1 focus:ring-driveBlue rounded-md py-2 px-4 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:bg-driveGray p-2 rounded-full">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
      />
    </div>
  );
};
