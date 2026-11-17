import React, { useState, useEffect } from 'react';
import { X, Trash2, HardDrive, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { formatBytes } from '../utils/formatters';

export function ClearCacheModal({ isOpen, onClose, onCacheCleared }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [category, setCategory] = useState('all'); // 'all' | 'videos' | 'photos'

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data.cache);
    } catch (e) {
      console.warn('Could not fetch cache stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSuccessMsg('');
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = async () => {
    try {
      setActionLoading(true);
      setSuccessMsg('');
      const res = await api.clearCache(category);
      setSuccessMsg(`Freed ${formatBytes(res.freedBytes)} across ${res.filesDeleted} files!`);
      await fetchStats();
      if (onCacheCleared) onCacheCleared();
    } catch (e) {
      alert(`Could not clear cache: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-950/40">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Clear Storage Cache</h2>
            <p className="text-xs text-neutral-400">Free up local disk space</p>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Current Cache Usage */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-neutral-500" />
              Total Disk Cache:
            </span>
            <span className="text-white font-bold text-sm">
              {stats ? formatBytes(stats.totalBytes) : '...'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80 text-[11px] font-mono text-center">
            <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">VIDEOS</span>
              <span className="text-white font-semibold">{stats ? formatBytes(stats.videos.bytes) : '0 B'}</span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">PHOTOS</span>
              <span className="text-white font-semibold">{stats ? formatBytes(stats.photos.bytes) : '0 B'}</span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">THUMBS</span>
              <span className="text-white font-semibold">{stats ? formatBytes(stats.thumbnails.bytes) : '0 B'}</span>
            </div>
          </div>
        </div>

        {/* Clear Scope Selection */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-semibold text-neutral-300 block">
            What would you like to delete?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'videos', label: 'Videos' },
              { id: 'photos', label: 'Photos' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCategory(opt.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  category === opt.id
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed mt-2">
            Deleting cached files only deletes saved disk media. Your indexed channel messages, captions, and library metadata are safely preserved in SQLite.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={actionLoading}
            className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all"
          >
            {actionLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Delete Selected Cache</span>
          </button>
        </div>

      </div>
    </div>
  );
}
