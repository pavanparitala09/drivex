import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Clock, Lock, Shield, Link, RefreshCw, Trash2 } from 'lucide-react';
import api from '../utils/axios';

const ShareLinkModal = ({ isOpen, onClose, file }) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryHours, setExpiryHours] = useState('24');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  
  const [shareData, setShareData] = useState(null);
  const [toast, setToast] = useState(null);
  const [customConfirm, setCustomConfirm] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen && file) {
      if (file.shareToken) {
        setShareData({
          shareToken: file.shareToken,
          shareExpiresAt: file.shareExpiresAt,
          isPasswordProtected: !!file.sharePassword
        });
        setHasExpiry(!!file.shareExpiresAt);
        if (file.shareExpiresAt) {
          const diffMs = new Date(file.shareExpiresAt) - new Date();
          const diffHours = Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));
          setExpiryHours(String(diffHours));
        }
        setHasPassword(!!file.sharePassword);
      } else {
        setShareData(null);
        setHasExpiry(false);
        setHasPassword(false);
        setPassword('');
      }
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const publicLink = `${window.location.protocol}//${window.location.host}/shared/public/${shareData?.shareToken}`;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload = {};
      if (hasExpiry) {
        payload.expirationHours = parseFloat(expiryHours);
      }
      if (hasPassword) {
        payload.password = password;
      } else {
        payload.password = ''; // empty string means remove password in backend
      }

      const res = await api.post(`/files/${file._id}/share-link`, payload);
      setShareData(res.data.data);
      // Update original file object tags/state
      file.shareToken = res.data.data.shareToken;
      file.shareExpiresAt = res.data.data.shareExpiresAt;
      file.sharePassword = res.data.data.isPasswordProtected ? 'hashed' : null;
      setToast({ type: 'success', message: 'Sharing settings updated successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to update share settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = () => {
    setCustomConfirm({
      title: 'Stop Public Sharing',
      message: 'Are you sure you want to disable public link sharing for this file? The existing link will stop working immediately.',
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.delete(`/files/${file._id}/share-link`);
          setShareData(null);
          file.shareToken = null;
          file.shareExpiresAt = null;
          file.sharePassword = null;
          setHasExpiry(false);
          setHasPassword(false);
          setPassword('');
          setToast({ type: 'success', message: 'Public link sharing disabled.' });
        } catch (err) {
          setToast({ type: 'error', message: err.response?.data?.message || 'Failed to disable sharing' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Public Link Sharing</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate max-w-[280px]" title={file.filename}>
                {file.filename}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {shareData ? (
            /* Active Link View */
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100/50 rounded-2xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-800">Sharing is active</h4>
                  <p className="text-xs font-medium text-emerald-600/80 mt-1">
                    Anyone with the link can view or download this file.
                  </p>
                </div>
              </div>

              {/* Copy URL Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Public Access URL</label>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 border border-slate-100 rounded-2xl">
                  <input 
                    type="text" 
                    readOnly
                    value={publicLink}
                    className="bg-transparent flex-1 text-sm text-slate-700 font-semibold px-3 outline-none select-all truncate"
                  />
                  <button 
                    onClick={handleCopy}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                      copied 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Info Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Expiration</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 mt-2">
                    {shareData.shareExpiresAt 
                      ? new Date(shareData.shareExpiresAt).toLocaleDateString() + ' ' + new Date(shareData.shareExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Never expires'
                    }
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Security</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 mt-2">
                    {shareData.isPasswordProtected ? 'Password Protected' : 'No Password'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Inactive Share View */
            <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
              <Link className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold text-sm">Public link is not generated yet</p>
              <p className="text-xs text-slate-400 mt-1">Configure sharing settings below to activate.</p>
            </div>
          )}

          {/* Share Settings Panel */}
          <div className="border-t border-slate-100/80 pt-6 space-y-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configure Settings</h4>

            {/* Expiry Selector */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-sm font-semibold text-slate-700">Set Expiration Timer</span>
              </label>

              {hasExpiry && (
                <div className="pl-7 animate-in fade-in slide-in-from-top-1 duration-150">
                  <select 
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 w-full"
                  >
                    <option value="1">1 Hour</option>
                    <option value="4">4 Hours</option>
                    <option value="24">24 Hours (1 Day)</option>
                    <option value="168">168 Hours (7 Days)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Password Toggle */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-sm font-semibold text-slate-700">Password Protect Download</span>
              </label>

              {hasPassword && (
                <div className="pl-7 animate-in fade-in slide-in-from-top-1 duration-150">
                  <input 
                    type="password"
                    placeholder="Enter security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 w-full placeholder-slate-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {shareData && (
              <button 
                onClick={handleDisable}
                disabled={loading}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Stop Sharing
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 bg-white hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={handleGenerate}
              disabled={loading || (hasPassword && !password && !shareData)}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : shareData ? (
                'Update Settings'
              ) : (
                'Generate Link'
              )}
            </button>
          </div>
        </div>

        {/* Custom Confirmation inside ShareLinkModal */}
        {customConfirm && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
              <h3 className="text-sm font-extrabold text-slate-800">{customConfirm.title}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">{customConfirm.message}</p>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setCustomConfirm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    customConfirm.onConfirm();
                    setCustomConfirm(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white shadow-lg shadow-rose-100 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local Toast inside ShareLinkModal */}
        {toast && (
          <div className="absolute bottom-4 left-4 right-4 z-[70] flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 animate-in slide-in-from-bottom-2 fade-in duration-200">
            {toast.type === 'success' ? (
              <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">✔</span>
            ) : (
              <span className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">✖</span>
            )}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareLinkModal;
