import React from 'react';
import { RefreshCw, Film, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';

export function SyncIndicator({ syncData }) {
  if (!syncData) return null;
  const { isSyncing, progress } = syncData;

  if (!isSyncing && progress?.status !== 'error') {
    return null;
  }

  if (progress?.status === 'error') {
    return (
      <div className="bg-rose-950/80 border-b border-rose-500/30 px-4 py-2.5 text-xs text-rose-300">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Sync failed: {progress.errorMessage || 'Unknown error occurred'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-rose-950/60 border-b border-rose-500/20 px-4 py-2 text-xs text-neutral-300 transition-all">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="w-4 h-4 text-rose-400 animate-spin flex-shrink-0" />
          <span className="font-semibold text-white">Synchronizing Channel:</span>
          <span className="text-neutral-300">{progress?.phase || 'Scanning channel messages...'}</span>
        </div>

        <div className="flex items-center gap-4 text-neutral-400 font-mono text-[11px]">
          <div>
            Scanned: <span className="text-white font-semibold">{progress?.messagesScanned || 0}</span> msgs
          </div>
          <div className="flex items-center gap-1">
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-white font-semibold">{progress?.videosAdded || 0}</span> videos
          </div>
          <div className="flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white font-semibold">{progress?.photosAdded || 0}</span> photos
          </div>
        </div>
      </div>
    </div>
  );
}
