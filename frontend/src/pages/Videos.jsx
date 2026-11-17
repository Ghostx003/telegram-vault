import React, { useState, useEffect, useCallback } from 'react';
import { Film, Dices, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { MediaCard } from '../components/MediaCard';
import { FilterBar } from '../components/FilterBar';

export function Videos({ 
  onPlayVideo, 
  onPlayRandomVideo, 
  searchTerm: globalSearch, 
  avoidRepetition, 
  onToggleAvoidRepetition 
}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(globalSearch || '');
  const [sort, setSort] = useState('newest');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Sync global search from navbar
  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch);
      setPage(1);
    }
  }, [globalSearch]);

  const loadVideos = useCallback(async (isLoadMore = false, targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);

      let startDate = null;
      const now = Math.floor(Date.now() / 1000);
      if (dateFilter === '7d') startDate = now - (7 * 86400);
      else if (dateFilter === '30d') startDate = now - (30 * 86400);

      const res = await api.getVideos({
        page: targetPage,
        limit: 24,
        sort,
        search,
        startDate,
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
    }
  }, [sort, search, dateFilter]);

  useEffect(() => {
    loadVideos(false, 1);
    setPage(1);
  }, [loadVideos]);

  const handleShuffleGrid = () => {
    setSort('random');
    setPage(1);
    loadVideos(false, 1);
  };

  const handleLoadMore = () => {
    if (page < pagination.totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadVideos(true, nextPage);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">All Videos</h1>
            <p className="text-xs text-neutral-400">Stream and discover videos from your private channel</p>
          </div>
        </div>

        <button
          onClick={onPlayRandomVideo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition-all hover:scale-105 active:scale-95"
          title="Play a surprise random video"
        >
          <Sparkles className="w-4 h-4" />
          <span>Surprise Me</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        sort={sort}
        onSortChange={(val) => { setSort(val); setPage(1); }}
        dateFilter={dateFilter}
        onDateFilterChange={(val) => { setDateFilter(val); setPage(1); }}
        onShuffle={handleShuffleGrid}
        avoidRepetition={avoidRepetition}
        onToggleAvoidRepetition={onToggleAvoidRepetition}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
          No videos matched your filters. Try clearing search terms or refreshing the library.
        </div>
      ) : null}

      {/* Loading & Pagination */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
        </div>
      )}

      {/* Load More Button */}
      {!loading && page < pagination.totalPages && (
        <div className="flex justify-center pt-8">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs border border-neutral-700 transition-all hover:scale-105"
          >
            Load More Videos ({videos.length} of {pagination.total})
          </button>
        </div>
      )}

    </div>
  );
}
