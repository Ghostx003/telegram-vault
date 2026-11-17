import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Film, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { MediaCard } from '../components/MediaCard';

export function RecentlyAdded({ onPlayVideo, onViewPhoto }) {
  const [mediaType, setMediaType] = useState('all'); // 'all' | 'video' | 'photo'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRecent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (mediaType === 'video') {
        const res = await api.getVideos({ limit: 36, sort: 'newest' });
        setItems(res.data);
      } else if (mediaType === 'photo') {
        const res = await api.getPhotos({ limit: 36, sort: 'newest' });
        setItems(res.data);
      } else {
        // Fetch both and combine sorted by date
        const [vRes, pRes] = await Promise.all([
          api.getVideos({ limit: 20, sort: 'newest' }),
          api.getPhotos({ limit: 20, sort: 'newest' }),
        ]);
        const combined = [...vRes.data, ...pRes.data].sort((a, b) => b.date - a.date);
        setItems(combined);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mediaType]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-rose-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Recently Added</h1>
            <p className="text-xs text-neutral-400">Chronological timeline of newly synchronized channel items</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          <button
            onClick={() => setMediaType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mediaType === 'all' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setMediaType('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mediaType === 'video' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setMediaType('photo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mediaType === 'photo' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Media Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
          {items.map((item) => (
            <MediaCard
              key={`${item.media_type}_${item.id}`}
              item={item}
              onPlayVideo={onPlayVideo}
              onViewPhoto={onViewPhoto}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="p-16 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 text-sm">
          No recent media available.
        </div>
      ) : null}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
        </div>
      )}

    </div>
  );
}
