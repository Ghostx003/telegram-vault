import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dices, 
  Shuffle, 
  Film, 
  Image as ImageIcon, 
  Sparkles, 
  RotateCcw, 
  Play,
  Layers,
  MousePointer,
  Flame,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import { MediaCard } from '../components/MediaCard';

export function RandomHub({ 
  onPlayRandomVideo, 
  onOpenRandomPhoto, 
  onPlayVideo,
  onViewPhoto,
  avoidRepetition, 
  setAvoidRepetition, 
  playedVideoCount, 
  playedPhotoCount,
  resetVideoSession,
  resetPhotoSession,
  counts,
  initialMediaType = 'videos'
}) {
  const [mediaType, setMediaType] = useState(initialMediaType); // 'videos' | 'photos'
  const [shuffledItems, setShuffledItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const isVideos = mediaType === 'videos';

  const loadShuffledGrid = useCallback(async () => {
    setLoading(true);
    try {
      if (mediaType === 'videos') {
        const res = await api.getVideos({ limit: 16, sort: 'random' });
        setShuffledItems(res.data || []);
      } else {
        const res = await api.getPhotos({ limit: 16, sort: 'random' });
        setShuffledItems(res.data || []);
      }
    } catch (e) {
      console.warn('Error loading shuffled media:', e);
    } finally {
      setLoading(false);
    }
  }, [mediaType]);

  useEffect(() => {
    loadShuffledGrid();
  }, [loadShuffledGrid]);

  const totalItems = isVideos ? (counts?.videos || 0) : (counts?.photos || 0);
  const currentPlayedCount = isVideos ? playedVideoCount : (playedPhotoCount || 0);
  const cyclePercent = totalItems > 0 
    ? Math.min(100, Math.round((currentPlayedCount / totalItems) * 100)) 
    : 0;

  const handleSurpriseClick = () => {
    if (isVideos) {
      onPlayRandomVideo();
    } else {
      onOpenRandomPhoto();
    }
  };

  const handleResetSession = () => {
    if (isVideos) {
      resetVideoSession();
    } else if (resetPhotoSession) {
      resetPhotoSession();
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-rose-950/40">
            <Shuffle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Shuffle & Surprise Hub</h1>
            <p className="text-xs text-neutral-400">Discover media unpredictably without repetition</p>
          </div>
        </div>

        {/* Media Selector Toggle Button */}
        <div className="flex items-center p-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
          <button
            onClick={() => setMediaType('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              isVideos
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-950/50 scale-[1.02]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Videos ({counts?.videos || 0})</span>
          </button>
          
          <button
            onClick={() => setMediaType('photos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              !isVideos
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-950/50 scale-[1.02]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photos ({counts?.photos || 0})</span>
          </button>
        </div>
      </div>

      {/* Unified Hero Showcase Card with Toggle & Surprise Me Button */}
      <div className={`relative overflow-hidden p-8 sm:p-10 rounded-3xl border shadow-2xl flex flex-col justify-between transition-all duration-500 ${
        isVideos 
          ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-rose-950/40 border-rose-500/20 shadow-rose-950/20' 
          : 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/40 border-amber-500/20 shadow-amber-950/20'
      }`}>
        {/* Glow ambient circle */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full filter blur-3xl pointer-events-none transition-all duration-700 ${
          isVideos ? 'bg-rose-600/15' : 'bg-amber-600/15'
        }`} />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl ${
              isVideos ? 'bg-rose-600 shadow-rose-950/60' : 'bg-amber-600 shadow-amber-950/60'
            }`}>
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
                isVideos ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {isVideos ? 'Random Video Discovery' : 'Random Photo Discovery'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isVideos ? 'Experience Genuine Random Video' : 'Discover High-Resolution Random Photo'}
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {isVideos
              ? 'Instantly launch a surprise video from your Telegram channel with smooth streaming and scroll-to-switch playback.'
              : 'Open a full-resolution photograph in the lightbox with scroll wheel cycling and instant next random photo discovery.'}
          </p>
        </div>

        {/* Action Button & Shortcuts */}
        <div className="pt-8 relative z-10 flex flex-wrap items-center gap-4">
          <button
            onClick={handleSurpriseClick}
            className={`flex items-center gap-2.5 px-7 py-4 rounded-2xl text-white font-black text-sm sm:text-base shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 ${
              isVideos
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 shadow-rose-950/80 hover:shadow-rose-900/90'
                : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 shadow-amber-950/80 hover:shadow-amber-900/90'
            }`}
          >
            <Dices className="w-5 h-5 animate-spin-slow" />
            <span>Surprise Me</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-black/25 uppercase">
              {isVideos ? 'Play Video' : 'Pick Photo'}
            </span>
          </button>

          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono bg-neutral-950/60 px-3.5 py-2.5 rounded-xl border border-neutral-800/80 backdrop-blur-md">
            <MousePointer className={`w-3.5 h-3.5 ${isVideos ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>Shortcut: Press N or scroll wheel on media to switch</span>
          </div>
        </div>
      </div>

      {/* Shuffle Session & Repetition Control */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800/80 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isVideos 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Shuffle Session Manager</h3>
              <p className="text-xs text-neutral-400">
                Guarantees non-repeating {isVideos ? 'video' : 'photo'} discovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Avoid Repetition */}
            <button
              onClick={() => setAvoidRepetition(!avoidRepetition)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                avoidRepetition
                  ? isVideos
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-sm'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                avoidRepetition 
                  ? (isVideos ? 'bg-rose-500 animate-pulse' : 'bg-amber-500 animate-pulse')
                  : 'bg-neutral-600'
              }`} />
              <span>{avoidRepetition ? 'Avoid Repetition: Active' : 'Avoid Repetition: Off'}</span>
            </button>

            {/* Reset Session */}
            {currentPlayedCount > 0 && (
              <button
                onClick={handleResetSession}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors"
                title="Clear played history and restart cycle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cycle</span>
              </button>
            )}
          </div>
        </div>

        {/* Cycle Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">
              Session Progress: <span className="text-white font-semibold">{currentPlayedCount}</span> of <span className="text-white font-semibold">{totalItems}</span> {isVideos ? 'videos' : 'photos'} explored
            </span>
            <span className={`font-semibold ${isVideos ? 'text-rose-400' : 'text-amber-400'}`}>
              {cyclePercent}%
            </span>
          </div>

          <div className="h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div
              style={{ width: `${cyclePercent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                isVideos
                  ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500'
                  : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400'
              }`}
            />
          </div>
          <p className="text-[11px] text-neutral-500">
            When enabled, each Surprise pick draws strictly from {isVideos ? 'videos' : 'photos'} you haven't seen in this session yet.
          </p>
        </div>
      </div>

      {/* Shuffled Media Grid - Large 4-column Grid for full photos or videos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${isVideos ? 'text-rose-400' : 'text-amber-400'}`} />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Shuffled {isVideos ? 'Video' : 'Photo'} Grid (4 Across)
            </h2>
          </div>

          <button
            onClick={loadShuffledGrid}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Shuffle className={`w-3.5 h-3.5 ${isVideos ? 'text-rose-400' : 'text-amber-400'} ${loading ? 'animate-spin' : ''}`} />
            <span>Re-shuffle</span>
          </button>
        </div>

        {/* 4 PHOTOS IN LARGE GRID SHOWING FULL PHOTO */}
        {shuffledItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {shuffledItems.map((item) => (
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
            No media available in this channel library.
          </div>
        ) : null}
      </section>

    </div>
  );
}
