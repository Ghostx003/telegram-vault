import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Film, Dices, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { MediaCard } from '../components/MediaCard';
import { FilterBar } from '../components/FilterBar';

export function Videos({ 
  onPlayVideo, 
  onPlayRandomVideo, 
  searchTerm: globalSearch
}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(globalSearch || '');
  const [sort, setSort] = useState('newest');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDays, setCustomDays] = useState(14);
  const [durationMode, setDurationMode] = useState('any'); // 'any' | 'longer' | 'shorter'
  const [durationMinutes, setDurationMinutes] = useState(10); // 10 | 20 | 30 | custom
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const observerTargetRef = useRef(null);

  // Sync global search from navbar
  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch);
      setPage(1);
    }
  }, [globalSearch]);

  const loadVideos = useCallback(async (isLoadMore = false, targetPage = 1) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Calculate start date based on filter
      let startDate = null;
      const now = Math.floor(Date.now() / 1000);
      if (dateFilter === '7d') startDate = now - (7 * 86400);
      else if (dateFilter === '30d') startDate = now - (30 * 86400);
      else if (dateFilter === '90d') startDate = now - (90 * 86400);
      else if (dateFilter === '180d') startDate = now - (180 * 86400);
      else if (dateFilter === '365d') startDate = now - (365 * 86400);
      else if (dateFilter === 'custom' && customDays > 0) startDate = now - (customDays * 86400);

      // Calculate duration filter in seconds
      let minDuration = null;
      let maxDuration = null;
      if (durationMode === 'longer' && durationMinutes > 0) {
        minDuration = durationMinutes * 60;
      } else if (durationMode === 'shorter' && durationMinutes > 0) {
        maxDuration = durationMinutes * 60;
      }

      const res = await api.getVideos({
        page: targetPage,
        limit: 24,
        sort,
        search,
        startDate,
        minDuration,
        maxDuration
      });

      if (isLoadMore) {
        setVideos(prev => [...prev, ...res.data]);
      } else {
        setVideos(res.data);
      }
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, search, dateFilter, customDays, durationMode, durationMinutes]);

  useEffect(() => {
    loadVideos(false, 1);
    setPage(1);
  }, [loadVideos]);

  const handleShuffleGrid = () => {
    setSort('random');
    setPage(1);
    loadVideos(false, 1);
  };

  const handleLoadMore = useCallback(() => {
    if (page < pagination.totalPages && !loading && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadVideos(true, nextPage);
    }
  }, [page, pagination.totalPages, loading, loadingMore, loadVideos]);

  // Automatic Infinite Scroll without asking the user
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
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Film className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">All Videos</h1>
            <p className="text-[11px] sm:text-xs text-neutral-400">Stream and discover channel videos</p>
          </div>
        </div>

        <button
          onClick={onPlayRandomVideo}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition-all hover:scale-105 active:scale-95"
          title="Play a surprise random video"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Surprise</span>
        </button>
      </div>

      {/* Filter and Search Bar with Duration & Custom Date options */}
      <FilterBar
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        sort={sort}
        onSortChange={(val) => { setSort(val); setPage(1); }}
        dateFilter={dateFilter}
        onDateFilterChange={(val) => { setDateFilter(val); setPage(1); }}
        customDays={customDays}
        onCustomDaysChange={(val) => { setCustomDays(val); setPage(1); }}
        durationMode={durationMode}
        onDurationModeChange={(val) => { setDurationMode(val); setPage(1); }}
        durationMinutes={durationMinutes}
        onDurationMinutesChange={(val) => { setDurationMinutes(val); setPage(1); }}
        showDurationFilter={true}
        onShuffle={handleShuffleGrid}
        totalResults={pagination.total}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Video Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
          {videos.map((video) => (
            <MediaCard
              key={video.id}
              item={video}
              onPlayVideo={onPlayVideo}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="p-16 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 text-sm">
          No videos matched your filters. Try clearing search terms or adjusting duration filters.
        </div>
      ) : null}

      {/* Initial Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
        </div>
      )}

      {/* Automatic Infinite Scroll Sentinel (Loads automatically without asking!) */}
      <div ref={observerTargetRef} className="py-6 flex flex-col items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <RefreshCw className="w-4 h-4 text-rose-500 animate-spin" />
            <span>Loading more videos...</span>
          </div>
        )}
        {!loading && page >= pagination.totalPages && videos.length > 0 && (
          <span className="text-[11px] text-neutral-500 font-mono">
            All {pagination.total} videos loaded
          </span>
        )}
      </div>

    </div>
  );
}
