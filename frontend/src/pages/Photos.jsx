import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image as ImageIcon, Dices, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { MediaCard } from '../components/MediaCard';
import { FilterBar } from '../components/FilterBar';

export function Photos({ 
  onViewPhoto, 
  onOpenRandomPhoto, 
  searchTerm: globalSearch 
}) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(globalSearch || '');
  const [sort, setSort] = useState('newest');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDays, setCustomDays] = useState(14);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const observerTargetRef = useRef(null);

  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearch(globalSearch);
      setPage(1);
    }
  }, [globalSearch]);

  const loadPhotos = useCallback(async (isLoadMore = false, targetPage = 1) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let startDate = null;
      const now = Math.floor(Date.now() / 1000);
      if (dateFilter === '7d') startDate = now - (7 * 86400);
      else if (dateFilter === '30d') startDate = now - (30 * 86400);
      else if (dateFilter === '90d') startDate = now - (90 * 86400);
      else if (dateFilter === '180d') startDate = now - (180 * 86400);
      else if (dateFilter === '365d') startDate = now - (365 * 86400);
      else if (dateFilter === 'custom' && customDays > 0) startDate = now - (customDays * 86400);

      const res = await api.getPhotos({
        page: targetPage,
        limit: 24,
        sort,
        search,
        startDate,
      });

      if (isLoadMore) {
        setPhotos(prev => [...prev, ...res.data]);
      } else {
        setPhotos(res.data);
      }
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, search, dateFilter, customDays]);

  useEffect(() => {
    loadPhotos(false, 1);
    setPage(1);
  }, [loadPhotos]);

  const handleShuffleGrid = () => {
    setSort('random');
    setPage(1);
    loadPhotos(false, 1);
  };

  const handleLoadMore = useCallback(() => {
    if (page < pagination.totalPages && !loading && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPhotos(true, nextPage);
    }
  }, [page, pagination.totalPages, loading, loadingMore, loadPhotos]);

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-950/20">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">All Photos</h1>
            <p className="text-xs text-neutral-400">Large showcase grid presenting full uncropped photographs</p>
          </div>
        </div>

        {/* Surprise Me Button */}
        <button
          onClick={onOpenRandomPhoto}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-950/50 transition-all hover:scale-105 active:scale-95"
          title="Open a surprise random photo in lightbox"
        >
          <Sparkles className="w-4 h-4" />
          <span>Surprise Me</span>
        </button>
      </div>

      {/* Filter and Search Bar with Date options */}
      <FilterBar
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        sort={sort}
        onSortChange={(val) => { setSort(val); setPage(1); }}
        dateFilter={dateFilter}
        onDateFilterChange={(val) => { setDateFilter(val); setPage(1); }}
        customDays={customDays}
        onCustomDaysChange={(val) => { setCustomDays(val); setPage(1); }}
        onShuffle={handleShuffleGrid}
        showDurationFilter={false}
        totalResults={pagination.total}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Photos Grid: 4 PHOTOS IN LARGE GRID SHOWING FULL PHOTO */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <MediaCard
              key={photo.id}
              item={photo}
              onViewPhoto={onViewPhoto}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className="p-16 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 text-sm">
          No photos matched your filters.
        </div>
      ) : null}

      {/* Initial Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      )}

      {/* Automatic Infinite Scroll Sentinel */}
      <div ref={observerTargetRef} className="py-6 flex flex-col items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
            <span>Loading more photos...</span>
          </div>
        )}
        {!loading && page >= pagination.totalPages && photos.length > 0 && (
          <span className="text-[11px] text-neutral-500 font-mono">
            All {pagination.total} photos loaded
          </span>
        )}
      </div>

    </div>
  );
}
