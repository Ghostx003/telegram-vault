import React, { useState } from 'react';
import { Film, Image as ImageIcon, Dices, Sparkles, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { FeaturedHero } from '../components/FeaturedHero';
import { MediaCard } from '../components/MediaCard';

export function Home({ 
  featuredVideo, 
  recentVideos, 
  recentPhotos, 
  onPlayVideo, 
  onViewPhoto, 
  onPlayRandomVideo, 
  onOpenRandomPhoto,
  setActiveTab, 
  counts,
  onStartSync, 
  isSyncing 
}) {
  const [activeMediaFilter, setActiveMediaFilter] = useState('all'); // 'all' | 'videos' | 'photos'

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      
      {/* Featured Video Hero */}
      <FeaturedHero 
        featuredVideo={featuredVideo} 
        onPlayVideo={onPlayVideo} 
        onPlayRandomVideo={onPlayRandomVideo} 
        counts={counts}
      />

      {/* Modern Quick Action Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Action 1: Surprise Video */}
        <div 
          onClick={onPlayRandomVideo}
          className="group p-5 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-rose-950/30 border border-neutral-800 hover:border-rose-500/50 cursor-pointer shadow-lg hover:shadow-rose-950/20 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">Surprise Me</span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
            Surprise Me: Video
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Instantly launch a surprise random video from the vault.
          </p>
        </div>

        {/* Action 2: Surprise Photo */}
        <div 
          onClick={onOpenRandomPhoto}
          className="group p-5 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800 hover:border-amber-500/50 cursor-pointer shadow-lg hover:shadow-amber-950/20 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
              <Dices className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Surprise Me</span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
            Surprise Me: Photo
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Discover a high-resolution photo with scroll cycling.
          </p>
        </div>

        {/* Action 3: Shuffle Grid */}
        <div 
          onClick={() => setActiveTab('random')}
          className="group p-5 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950/30 border border-neutral-800 hover:border-indigo-500/50 cursor-pointer shadow-lg hover:shadow-indigo-950/20 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <Dices className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">Hub</span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
            Shuffle Experience
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Watch with non-repeating shuffle cycle sessions.
          </p>
        </div>

        {/* Action 4: Sync Channel */}
        <div 
          onClick={() => onStartSync(false)}
          className={`group p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 hover:border-neutral-700 cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1 ${
            isSyncing ? 'border-rose-500/40 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center border border-neutral-700 ${
              isSyncing ? 'text-rose-400' : 'group-hover:scale-110'
            } transition-transform`}>
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-rose-400' : ''}`} />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              {isSyncing ? 'Syncing...' : 'Telegram'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-neutral-200 transition-colors">
            {isSyncing ? 'Synchronizing...' : 'Refresh Library'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Fetch newly published media from your channel.
          </p>
        </div>

      </div>

      {/* Section Media Switcher Toggle */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Recent Additions</h2>
          <p className="text-xs text-neutral-400">Browse newly synchronized photos and videos</p>
        </div>

        {/* Segmented Toggle for Home Section */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveMediaFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMediaFilter === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveMediaFilter('videos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMediaFilter === 'videos'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setActiveMediaFilter('photos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMediaFilter === 'photos'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
        </div>
      </div>

      {/* Section: Recently Added Videos */}
      {(activeMediaFilter === 'all' || activeMediaFilter === 'videos') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Latest Videos</h3>
                <p className="text-xs text-neutral-400">Stream directly from your channel</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('videos')}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors group"
            >
              <span>View All ({counts?.videos || 0})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {recentVideos && recentVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {recentVideos.slice(0, 8).map((video) => (
                <MediaCard
                  key={video.id}
                  item={video}
                  onPlayVideo={onPlayVideo}
                  onViewPhoto={onViewPhoto}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 text-xs">
              No videos synchronized yet. Click "Refresh Library" to pull media from your Telegram channel.
            </div>
          )}
        </section>
      )}

      {/* Section: Recently Added Photos - 4 PHOTOS IN LARGE GRID SHOWING FULL PHOTO */}
      {(activeMediaFilter === 'all' || activeMediaFilter === 'photos') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Latest Photos (Full View)</h3>
                <p className="text-xs text-neutral-400">High-resolution uncropped photographs (4 across)</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('photos')}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors group"
            >
              <span>View All ({counts?.photos || 0})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {recentPhotos && recentPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4.5">
              {recentPhotos.slice(0, 8).map((photo) => (
                <MediaCard
                  key={photo.id}
                  item={photo}
                  onPlayVideo={onPlayVideo}
                  onViewPhoto={onViewPhoto}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 text-xs">
              No photos synchronized yet.
            </div>
          )}
        </section>
      )}

    </div>
  );
}
