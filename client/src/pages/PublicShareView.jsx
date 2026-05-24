import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { HardDrive, Lock, Unlock, Download, AlertCircle, FileText, Image, Film, RefreshCw, CheckCircle } from 'lucide-react';

const formatSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return <FileText className="text-slate-400 w-16 h-16" />;
  if (mimeType.startsWith('image/')) return <Image className="text-blue-500 w-16 h-16 animate-pulse" />;
  if (mimeType.startsWith('video/')) return <Film className="text-red-500 w-16 h-16" />;
  return <FileText className="text-indigo-500 w-16 h-16" />;
};

const PublicShareView = () => {
  const { token } = useParams();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/public-share/${token}`);
      setMetadata(res.data.data);
      setPasswordRequired(res.data.data.isPasswordProtected);
    } catch (err) {
      setError(err.response?.data?.message || 'Link is invalid, expired, or has been disabled.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [token]);

  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    setVerifying(true);
    setVerifyError('');
    setDownloadProgress('Connecting...');
    
    try {
      // Use axios to fetch the file blob. If password is wrong, it returns 401.
      const url = `http://localhost:5000/api/public-share/${token}/download${
        passwordRequired ? `?password=${encodeURIComponent(password)}` : ''
      }`;
      
      const res = await axios.get(url, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || metadata.size || 1));
          setDownloadProgress(`Downloading: ${percentCompleted}%`);
        }
      });

      // Verification and download success
      const blob = res.data;
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = metadata.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setDownloadProgress(null);
      setPasswordRequired(false); // Hide lock if it was visible
      
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 5000);

    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setVerifyError('Incorrect password. Please try again.');
      } else {
        setVerifyError(err.response?.data?.message || 'Failed to download file. Please check connection.');
      }
      setDownloadProgress(null);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-screen w-full min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-white">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
          <span className="text-sm font-semibold text-slate-300">Locating shared resource...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-screen w-full min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl max-w-md w-full text-center">
          <div className="bg-rose-500/20 text-rose-400 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Link Error</h2>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">{error}</p>
          <button 
            onClick={() => window.close()}
            className="mt-8 px-6 py-3 w-full bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/5"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-screen w-full min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 flex items-center justify-center p-6">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 p-8 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Logo/Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl text-white shadow-md">
            <HardDrive className="w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">DriveX Shared File</span>
        </div>

        {passwordRequired ? (
          /* Lock Screen State */
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Password Protected File</h2>
              <p className="text-xs font-semibold text-slate-400">
                You need a security password to download this resource.
              </p>
            </div>

            <form onSubmit={handleDownload} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Password</label>
                <input 
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 w-full placeholder-slate-300"
                />
              </div>

              {verifyError && (
                <div className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-xl flex items-center gap-2 border border-rose-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {verifyError}
                </div>
              )}

              <button 
                type="submit"
                disabled={verifying}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {verifying ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Unlock className="w-5 h-5" /> Unlock & Download
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Landing/Download Screen */
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 p-6 bg-slate-50 border border-slate-100 rounded-3xl relative">
                {getFileIcon(metadata?.mimeType)}
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 break-all px-4" title={metadata?.filename}>
                {metadata?.filename}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-xs font-bold text-slate-400">
                <span>{formatSize(metadata?.size)}</span>
                <span>•</span>
                <span>{metadata?.mimeType || 'unknown format'}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-500 space-y-2">
              <div className="flex justify-between">
                <span>Shared On</span>
                <span className="text-slate-700">{new Date(metadata?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Link Status</span>
                <span className="text-emerald-600 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
            </div>

            {downloadSuccess && (
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-4 rounded-2xl flex items-center gap-2 border border-emerald-100/50 animate-in fade-in duration-300">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                Download initiated successfully!
              </div>
            )}

            {verifyError && !downloadSuccess && (
              <div className="text-xs font-bold text-rose-500 bg-rose-50 p-4 rounded-2xl flex items-center gap-2 border border-rose-100 animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                {verifyError}
              </div>
            )}

            <button 
              onClick={() => handleDownload()}
              disabled={verifying}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {downloadProgress || 'Downloading...'}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Download File
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicShareView;
