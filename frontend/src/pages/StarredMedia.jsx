import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, Film, Image as ImageIcon, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { MediaCard } from '../components/MediaCard';

export function StarredMedia({ 
  onPlayVideo, 
  onViewPhoto 
}) {
  const [mediaType, setMediaType] = useState('videos'); // 'videos' | 'photos'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ videos: 0, photos: 0 });

  const observerTargetRef = useRef(null);
  const isVideos = mediaType === 'videos';

  // Load Starred counts across all channels
  const refreshCounts = useCallback(async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        api.getVideos({ limit: 1, starred: 'true', channel_id: 'all' }).catch(() => ({ pagination: { total: 0 } })),
        api.getPhotos({ limit: 1, starred: 'true', channel_id: 'all' }).catch(() => ({ pagination: { total: 0 } })),
      ]);
      const vCount = vRes?.pagination?.total || 0;
      const pCount = pRes?.pagination?.total || 0;
      setCounts({ videos: vCount, photos: pCount });
      return { videos: vCount, photos: pCount };
    } catch (e) {
      return { videos: 0, photos: 0 };
    }
  }, []);

  // Initial mount: check counts and auto-pick tab with content if one is empty
  useEffect(() => {
    refreshCounts().then(({ videos, photos }) => {
      if (videos === 0 && photos > 0) {
        setMediaType('photos');
      }
    });
  }, [refreshCounts]);

  const loadStarred = useCallback(async (isLoadMore = false, targetPage = 1) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const endpoint = isVideos ? api.getVideos : api.getPhotos;
      const res = await endpoint({
        page: targetPage,
        limit: 24,
        sort: 'newest',
        starred: 'true',
        channel_id: 'all'
      });

      if (isLoadMore) {
        setItems(prev => [...prev, ...(res.data || [])]);
      } else {
        setItems(res.data || []);
      }
      setPagination(res.pagination || { total: res.data?.length || 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isVideos]);

  useEffect(() => {
    setPage(1);
    loadStarred(false, 1);
  }, [loadStarred]);

  // Remove card immediately if unstarred by user
  const handleItemStarChange = (changedItem, isStarredNow) => {
    if (!isStarredNow) {
      setItems(prev => prev.filter(i => (i.id ? i.id !== changedItem.id : i.telegram_message_id !== changedItem.telegram_message_id)));
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
      setCounts(prev => ({
        ...prev,
        [isVideos ? 'videos' : 'photos']: Math.max(0, prev[isVideos ? 'videos' : 'photos'] - 1)
      }));
    } else {
      refreshCounts();
    }
  };

  const handleLoadMore = useCallback(() => {
    if (page < pagination.totalPages && !loading && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadStarred(true, nextPage);
    }
  }, [page, pagination.totalPages, loading, loadingMore, loadStarred]);

  // Automatic Infinite Scroll without asking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < pagination.totalPages) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    const currentElem = observerTargetRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) observer.unobserve(currentElem);
    };
  }, [loading, loadingMore, page, pagination.totalPages, handleLoadMore]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 text-white shadow-xl shadow-amber-950/50">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Starred Media</span>
              {pagination.total > 0 && (
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pagination.total} {isVideos ? (pagination.total === 1 ? 'video' : 'videos') : (pagination.total === 1 ? 'photo' : 'photos')}
                </span>
              )}
            </h1>
            <p className="text-xs text-neutral-400">Only your starred favorite videos and photographs are displayed here</p>
          </div>
        </div>

        {/* Media Selector Toggle Button */}
        <div className="flex items-center p-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
          <button
            onClick={() => setMediaType('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              isVideos
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-950/50 scale-[1.02]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Starred Videos</span>
            {counts.videos > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                isVideos ? 'bg-white/25 text-white font-bold' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {counts.videos}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setMediaType('photos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              !isVideos
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/50 scale-[1.02]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Starred Photos</span>
            {counts.photos > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                !isVideos ? 'bg-white/25 text-white font-bold' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {counts.photos}
              </span>
            )}
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

      {/* Starred Media Grid: 2 COLUMNS ON MOBILE */}
      {items.length > 0 ? (
        <div className={
          isVideos 
            ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4"
            : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4"
        }>
          {items.map((item) => (
            <MediaCard
              key={`${item.media_type}_${item.id}`}
              item={item}
              onPlayVideo={onPlayVideo}
              onViewPhoto={onViewPhoto}
              onStarChange={handleItemStarChange}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="p-16 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 text-sm max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg">
            <Star className="w-7 h-7 fill-amber-400/50" />
          </div>
          <h3 className="text-base font-bold text-white">
            No Starred {isVideos ? 'Videos' : 'Photos'} Yet
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            While browsing or playing media, click the <span className="text-amber-400 font-semibold">⭐ Star</span> button on any card or player to save your favorites here for quick access!
          </p>
        </div>
      ) : null}

      {/* Initial Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className={`w-6 h-6 animate-spin ${isVideos ? 'text-rose-500' : 'text-amber-500'}`} />
        </div>
      )}

      {/* Automatic Infinite Scroll Sentinel */}
      <div ref={observerTargetRef} className="py-6 flex flex-col items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <RefreshCw className={`w-4 h-4 animate-spin ${isVideos ? 'text-rose-500' : 'text-amber-500'}`} />
            <span>Loading more starred {isVideos ? 'videos' : 'photos'}...</span>
          </div>
        )}
      </div>

    </div>
  );
}
