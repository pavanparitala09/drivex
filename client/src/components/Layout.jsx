import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../store/authSlice';
import { HardDrive, LogOut, Settings, FolderOpen, Clock, Star, Trash2, FolderPlus, Upload, Cloud, FileText, Menu } from 'lucide-react';
import UploadModal from './UploadModal';
import FolderModal from './FolderModal';

export const ProtectedLayout = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

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

  const navLinks = [
    { name: 'My Drive', icon: FolderOpen, path: '/' },
    { name: 'Shared with me', icon: Clock, path: '/shared' },
    { name: 'Starred', icon: Star, path: '/starred' },
    { name: 'Trash', icon: Trash2, path: '/trash' },
  ];

  const standardTags = [
    { name: 'High Priority', label: '🔴 High', color: '#ef4444' },
    { name: 'Work', label: '🔵 Work', color: '#3b82f6' },
    { name: 'Receipts', label: '🟢 Receipts', color: '#10b981' },
    { name: 'Personal', label: '🟡 Personal', color: '#f59e0b' }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-all duration-300 animate-in fade-in"
        />
      )}

      {/* Modern Glass Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 m-4 rounded-3xl bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200/50 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:m-4 lg:w-72 lg:flex ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'
      }`}>
        
        {/* Elegant Logo Header */}
        <div className="p-6 pb-4 flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100 text-white flex items-center justify-center">
            <HardDrive className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 tracking-tight">DriveX</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Cloud Storage</span>
          </div>
        </div>
        
        {/* Modern Capsule Action Button */}
        <div className="px-6 py-2 relative">
          <button 
            onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-xl font-light leading-none">+</span> Create New
          </button>
          
          {isNewMenuOpen && (
            <div className="absolute top-16 left-6 right-6 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button 
                onClick={() => { setIsFolderModalOpen(true); setIsNewMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm font-semibold text-slate-700 transition-colors"
              >
                <div className="bg-indigo-50 p-2 rounded-lg mr-3 text-indigo-600">
                  <FolderPlus className="w-4.5 h-4.5" />
                </div>
                New folder
              </button>
              <div className="border-t border-slate-50 my-1"></div>
              <button 
                onClick={() => { setIsUploadModalOpen(true); setIsNewMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm font-semibold text-slate-700 transition-colors"
              >
                <div className="bg-purple-50 p-2 rounded-lg mr-3 text-purple-600">
                  <Upload className="w-4.5 h-4.5" />
                </div>
                File upload
              </button>
              <div className="border-t border-slate-50 my-1"></div>
              <button 
                onClick={() => { navigate('/editor/new'); setIsNewMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm font-semibold text-slate-700 transition-colors"
              >
                <div className="bg-emerald-50 p-2 rounded-lg mr-3 text-emerald-600">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                New document
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar my-4 space-y-6">
          <nav className="px-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link 
                  key={link.name}
                  to={link.path} 
                  className={`flex items-center px-4 py-3 text-xs font-bold rounded-xl transition-all relative ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600 rounded-l-none' 
                      : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`mr-3.5 w-4.5 h-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Dynamic Tag Filters in Sidebar */}
          <div className="px-4 border-t border-slate-100/60 pt-4">
            <span className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2.5">Categories</span>
            <div className="space-y-0.5">
              {standardTags.map((tag) => {
                const isActive = location.pathname === `/tags/${tag.name}`;
                return (
                  <Link 
                    key={tag.name}
                    to={`/tags/${tag.name}`}
                    className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      isActive 
                        ? 'bg-slate-100 text-indigo-700 shadow-sm border-l-4 border-indigo-600 rounded-l-none' 
                        : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full mr-3.5 flex-shrink-0" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Premium Inline Storage Widget */}
        <div className="px-6 py-4 mt-auto border-t border-slate-100/60 bg-slate-50/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-indigo-500" /> Storage
            </span>
            <span className="font-extrabold text-slate-700">{storagePercentage}% Used</span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2 shadow-inner">
            <div 
              className={`h-1.5 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                storagePercentage > 90 ? 'from-red-500 to-rose-600' : storagePercentage > 75 ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-purple-500'
              }`} 
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] text-slate-400 font-bold">{storageUsedFormatted} of {maxStorageFormatted}</span>
            <Link 
              to="/storage" 
              className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
            >
              Clean Up →
            </Link>
          </div>
        </div>

        {/* User profile row */}
        <div className="p-5 border-t border-slate-100/60 flex items-center justify-between bg-slate-50/20">
          <div className="flex items-center min-w-0 mr-3">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full shadow-sm border border-slate-200" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-md flex-shrink-0 text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="ml-3 truncate">
              <p className="text-xs font-extrabold text-slate-800 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">{user?.email || ''}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex-shrink-0 cursor-pointer shadow-sm hover:shadow-inner bg-white border border-slate-200/50"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 w-full min-w-0">
        {/* Modern Top Navbar */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 py-4 z-20 gap-3">
          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setIsMobileSidebarOpen(true)} 
            className="lg:hidden p-2.5 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-2xl text-slate-600 transition-all active:scale-95 flex-shrink-0 flex items-center justify-center"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-2xl relative group min-w-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search files..." 
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-2xl py-3 pl-12 pr-4 outline-none transition-all shadow-sm text-slate-700 placeholder-slate-400 font-medium text-sm truncate"
            />
          </div>
          <div className="flex items-center space-x-3 ml-2 flex-shrink-0">
            <button className="text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 shadow-sm p-3 rounded-2xl transition-all hover:scale-105 active:scale-95">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto px-4 pb-4 md:px-8 md:pb-8 no-scrollbar relative z-10">
          <div className="bg-white/60 backdrop-blur-3xl min-h-full rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm">
            <Outlet />
          </div>
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
