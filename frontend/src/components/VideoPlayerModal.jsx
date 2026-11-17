import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Maximize, 
  Minimize, 
  SkipForward, 
  SkipBack, 
  Dices, 
  Calendar, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Info,
  Clock,
  HardDrive,
  FastForward,
  Rewind,
  Smartphone,
  Maximize2,
  Star
} from 'lucide-react';
import { api } from '../api/client';
import { formatDuration, formatDate } from '../utils/formatters';

export function VideoPlayerModal({ 
  video, 
  onClose, 
  onNextRandomVideo, 
  onPrevVideo,
  avoidRepetition,
  playedCount 
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video?.duration || 0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [videoStatus, setVideoStatus] = useState('checking'); // 'checking' | 'cached' | 'streaming'
  const [isBuffering, setIsBuffering] = useState(true);

  // Mobile & Netflix Gesture States
  const [coverNotch, setCoverNotch] = useState(true);
  const [swipeSeek, setSwipeSeek] = useState({ active: false, delta: 0, targetTime: 0 });
  const [swipeVertical, setSwipeVertical] = useState({ active: false, dy: 0 });
  const [isStarred, setIsStarred] = useState(Boolean(video?.is_starred));

  useEffect(() => {
    setIsStarred(Boolean(video?.is_starred));
  }, [video?.telegram_message_id, video?.is_starred]);

  const handleToggleStar = async () => {
    try {
      const next = !isStarred;
      setIsStarred(next);
      if (video) video.is_starred = next ? 1 : 0;
      await api.toggleStar(video.id || video.telegram_message_id, video.channel_id);
    } catch (e) {
      console.warn('Star toggle error:', e);
    }
  };

  // Gesture Tracking Refs
  const isTouchInteractionRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0, videoTime: 0 });
  const gestureLockedRef = useRef(null); // 'seek' | 'vertical' | null
  const wasGestureRef = useRef(false);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef(null);
  const lastScrollTimeRef = useRef(0);

  if (!video) return null;

  const streamUrl = api.getVideoStreamUrl(video.telegram_message_id, video.channel_id);

  // Check cache status
  useEffect(() => {
    if (typeof api.getMediaStatus === 'function') {
      api.getMediaStatus(video.telegram_message_id, video.channel_id)
        .then(res => {
          setVideoStatus(res?.status === 'cached' ? 'cached' : 'streaming');
        })
        .catch(() => setVideoStatus('streaming'));
    } else {
      setVideoStatus('streaming');
    }

    // Record view
    if (typeof api.recordView === 'function') {
      api.recordView(video.telegram_message_id).catch(() => {});
    }
  }, [video.telegram_message_id]);

  // Handle Fullscreen Changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Video time & buffer updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }

    // Update buffered
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / (videoRef.current.duration || 1)) * 100);
    }
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => console.warn('Play error:', e));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = (time) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(time, duration));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleProgressClick = (e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const handleProgressMouseMove = (e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleVolumeChange = (newVol) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = currentIndex !== -1 ? speeds[(currentIndex + 1) % speeds.length] : 1;
    changeSpeed(nextSpeed);
  };

  // Toggle Fullscreen with Landscape Lock for Phone Notch Coverage
  const toggleFullscreen = useCallback(async (lockLandscape = false) => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        }
        setIsFullscreen(true);

        // Lock landscape orientation on mobile devices covering the notch
        if (lockLandscape && window.screen?.orientation?.lock) {
          try {
            await window.screen.orientation.lock('landscape');
          } catch (e) {
            // Orientation lock might require native app or unsupported on desktop
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
        if (window.screen?.orientation?.unlock) {
          try {
            window.screen.orientation.unlock();
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  }, []);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - (e.shiftKey ? 15 : 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + (e.shiftKey ? 15 : 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen(true);
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          if (onNextRandomVideo) onNextRandomVideo();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          if (onPrevVideo) onPrevVideo();
          break;
        case 'Escape':
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, volume, isMuted, togglePlay, onClose, onNextRandomVideo, onPrevVideo, toggleFullscreen]);

  // Wheel scroll to switch video
  const handleWheel = useCallback((e) => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 450) return; // 450ms debounce

    if (e.deltaY > 25) {
      lastScrollTimeRef.current = now;
      if (onNextRandomVideo) onNextRandomVideo();
    } else if (e.deltaY < -25) {
      lastScrollTimeRef.current = now;
      if (onPrevVideo) onPrevVideo();
    }
  }, [onNextRandomVideo, onPrevVideo]);

  // Controls auto-hide on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !swipeSeek.active && !swipeVertical.active && !is2xActive) {
        setShowControls(false);
      }
    }, 3000);
  };

  // -------------------------------------------------------------
  // GESTURES: DOUBLE TAP / DBLCLICK (FULLSCREEN), 
  // SWIPE SEEK (LEFT/RIGHT), SWIPE SWITCH (UP/DOWN),
  // CLICK ON VIDEO (PLAY/PAUSE RESUME)
  // -------------------------------------------------------------
  
  const handleTouchStart = (e) => {
    isTouchInteractionRef.current = true;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      videoTime: videoRef.current ? videoRef.current.currentTime : 0
    };
    gestureLockedRef.current = null;
    wasGestureRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    // Determine gesture
    if (!gestureLockedRef.current) {
      if (Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy)) {
        // Horizontal Drag -> Netflix-style Seek!
        gestureLockedRef.current = 'seek';
        wasGestureRef.current = true;
      } else if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx)) {
        // Vertical Drag -> Next Random Video!
        gestureLockedRef.current = 'vertical';
        wasGestureRef.current = true;
      }
    }

    // Horizontal Seek Gesture Progress
    if (gestureLockedRef.current === 'seek') {
      const sensitivity = 90; // Up to 90 seconds forward/backward
      const deltaSecs = Math.round((dx / (window.innerWidth || 360)) * sensitivity);
      const target = Math.max(0, Math.min(duration, touchStartRef.current.videoTime + deltaSecs));
      setSwipeSeek({ active: true, delta: deltaSecs, targetTime: target });
    }

    // Vertical Video Switch Gesture Progress
    if (gestureLockedRef.current === 'vertical') {
      setSwipeVertical({ active: true, dy });
    }
  };

  const handleTouchEnd = () => {
    // Finish Horizontal Seek
    if (gestureLockedRef.current === 'seek') {
      if (swipeSeek.active) {
        seek(swipeSeek.targetTime);
      }
      setSwipeSeek({ active: false, delta: 0, targetTime: 0 });
      wasGestureRef.current = true;
      return;
    }

    // Finish Vertical Switch to New Random Video
    if (gestureLockedRef.current === 'vertical') {
      if (Math.abs(swipeVertical.dy) > 45) {
        if (onNextRandomVideo) onNextRandomVideo();
      }
      setSwipeVertical({ active: false, dy: 0 });
      wasGestureRef.current = true;
      return;
    }

    // Handle Tap vs Double Tap
    if (!wasGestureRef.current) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // DOUBLE TAP -> Fullscreen & Landscape (Cover Notch!)
        if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
        toggleFullscreen(true);
      } else {
        // SINGLE TAP -> Toggle Controls & Play/Pause
        lastTapRef.current = now;
        if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = setTimeout(() => {
          togglePlay();
          setShowControls(prev => !prev);
        }, 250);
      }
    }
  };

  // Click on the video area toggles play/pause immediately on desktop!
  const handleVideoAreaClick = (e) => {
    if (isTouchInteractionRef.current) {
      isTouchInteractionRef.current = false;
      return;
    }
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
      return;
    }
    togglePlay();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fadeIn select-none">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        className="relative w-full h-full max-h-screen flex flex-col justify-between bg-black select-none overflow-hidden"
      >
        
        {/* Top Header Bar */}
        <div className={`absolute top-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/95 via-black/60 to-transparent transition-opacity duration-300 pt-safe pl-safe pr-safe ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800/80 transition-colors shadow-lg"
                title="Close Player (Esc)"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-white truncate max-w-xl">
                    {video.caption || video.file_name || `Video #${video.telegram_message_id}`}
                  </h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono uppercase">
                    HD
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono mt-0.5">
                  <span>{formatDate(video.date)}</span>
                  <span>•</span>
                  <span>Msg #{video.telegram_message_id}</span>
                  {videoStatus === 'cached' && (
                    <span className="text-emerald-400 font-semibold">• Cached</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Star / Favorite Button */}
              <button
                onClick={handleToggleStar}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isStarred
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/40'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700/80 text-neutral-300 hover:text-white'
                }`}
                title={isStarred ? "Remove from Starred" : "Star this Video (Save to Starred Media)"}
              >
                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-neutral-400'}`} />
                <span className="hidden sm:inline">{isStarred ? 'Starred' : 'Star'}</span>
              </button>
              {/* Notch Coverage Toggle Button (for Phone Fullscreen) */}
              {isFullscreen && (
                <button
                  onClick={() => setCoverNotch(!coverNotch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    coverNotch 
                      ? 'bg-rose-600/30 border-rose-500/50 text-rose-300' 
                      : 'bg-neutral-900/80 border-neutral-700 text-neutral-300'
                  }`}
                  title={coverNotch ? "Cover Notch / Edge-to-Edge Active" : "Fit to Screen"}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{coverNotch ? 'Fill Notch' : 'Fit'}</span>
                </button>
              )}

              {video.message_link && (
                <a
                  href={video.message_link}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 transition-all"
                  title="Open in Telegram app"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>
              )}

              {/* Next Random Video Button in top bar */}
              <button
                onClick={onNextRandomVideo}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all hover:scale-105 active:scale-95"
                title="Play Next Random Video (Scroll / Swipe Up)"
              >
                <Dices className="w-4 h-4 animate-spin-slow" />
                <span>Next Random</span>
              </button>
            </div>
          </div>
        </div>

        {/* Video Element & Central Play Area with Click & Touch Gestures */}
        <div 
          onClick={handleVideoAreaClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onDoubleClick={(e) => {
            e.stopPropagation();
            toggleFullscreen(true);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="relative flex-1 flex items-center justify-center cursor-pointer w-full h-full touch-none select-none overflow-hidden"
        >
          <video
            ref={videoRef}
            src={streamUrl}
            autoPlay
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onLoadedMetadata={() => {
              if (videoRef.current && videoRef.current.duration) {
                setDuration(videoRef.current.duration);
              }
              setIsBuffering(false);
            }}
            onEnded={() => {
              if (onNextRandomVideo) onNextRandomVideo();
            }}
            className={`w-full h-full transition-all duration-300 ${
              isFullscreen 
                ? (coverNotch ? 'object-cover max-h-screen' : 'object-contain max-h-screen')
                : 'max-h-[85vh] object-contain'
            }`}
          />

          {/* Buffering spinner */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20">
              <div className="w-14 h-14 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Central Play/Pause Flash Icon */}
          {!isPlaying && !isBuffering && !swipeSeek.active && !swipeVertical.active && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-20 h-20 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl shadow-rose-950/80 animate-scaleUp">
                <Play className="w-10 h-10 fill-current ml-1.5" />
              </div>
            </div>
          )}


          {/* ⏩ NETFLIX-STYLE SWIPE SEEK HUD OVERLAY */}
          {swipeSeek.active && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-fadeIn">
              <div className="flex flex-col items-center gap-2 px-8 py-5 rounded-3xl bg-black/85 border border-white/20 text-white shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-2 text-rose-400 font-black text-2xl">
                  {swipeSeek.delta >= 0 ? (
                    <FastForward className="w-8 h-8 fill-current" />
                  ) : (
                    <Rewind className="w-8 h-8 fill-current" />
                  )}
                  <span>{swipeSeek.delta >= 0 ? `+${swipeSeek.delta}s` : `${swipeSeek.delta}s`}</span>
                </div>
                <div className="text-sm font-mono text-neutral-300">
                  <span className="text-white font-bold">{formatDuration(swipeSeek.targetTime)}</span> / {formatDuration(duration)}
                </div>
              </div>
            </div>
          )}

          {/* 🎲 SWIPE UP / DOWN TO SWITCH VIDEO HUD OVERLAY */}
          {swipeVertical.active && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-fadeIn">
              <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-3xl bg-neutral-950/90 border border-rose-500/50 text-white shadow-2xl backdrop-blur-xl animate-pulse">
                <Dices className="w-10 h-10 text-rose-400 animate-spin-slow" />
                <span className="text-base font-black tracking-tight text-white">
                  Release for New Random Video
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {swipeVertical.dy < 0 ? '↑ Swiping Up' : '↓ Swiping Down'}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Control Bar */}
        <div className={`absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/85 to-transparent transition-opacity duration-300 pb-safe pl-safe pr-safe ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="space-y-3 max-w-6xl mx-auto">
            
            {/* Timeline Scrub Bar */}
            <div 
              ref={progressBarRef}
              onClick={handleProgressClick}
              onMouseMove={handleProgressMouseMove}
              onMouseLeave={() => setHoverTime(null)}
              className="relative h-2 hover:h-3 bg-neutral-800/80 rounded-full cursor-pointer transition-all group"
            >
              {/* Buffered Bar */}
              <div 
                style={{ width: `${buffered}%` }} 
                className="absolute inset-y-0 left-0 bg-neutral-600/60 rounded-full transition-all" 
              />

              {/* Progress Played Bar */}
              <div 
                style={{ width: `${progressPercent}%` }} 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-600 to-rose-500 rounded-full"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md shadow-black scale-0 group-hover:scale-100 transition-transform" />
              </div>

              {/* Hover Time Tooltip */}
              {hoverTime !== null && (
                <div 
                  style={{ left: `${hoverPosition}%` }}
                  className="absolute bottom-4 -translate-x-1/2 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-white text-[10px] font-mono pointer-events-none whitespace-nowrap shadow-lg"
                >
                  {formatDuration(hoverTime)}
                </div>
              )}
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Previous Video in history */}
                {onPrevVideo && (
                  <button
                    onClick={onPrevVideo}
                    className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Previous Video in Session (P)"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                )}

                {/* Play / Pause Button */}
                <button
                  onClick={togglePlay}
                  className="p-2 text-white hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Play / Pause (Space)"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>

                {/* Next Random Video Button */}
                {onNextRandomVideo && (
                  <button
                    onClick={onNextRandomVideo}
                    className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Next Random Video (N / Swipe)"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                )}

                {/* Volume / Mute Control */}
                <div className="hidden sm:flex items-center gap-2 group/vol">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-neutral-500" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 accent-rose-500 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Time Display */}
                <div className="text-xs font-mono text-neutral-400">
                  <span className="text-white">{formatDuration(currentTime)}</span>
                  <span> / </span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              {/* Right Side Options */}
              <div className="flex items-center gap-2">
                {/* Direct Speed Cycling Button (1x -> 1.25x -> 1.5x -> 1.75x -> 2x -> 1x) */}
                <button
                  onClick={cyclePlaybackSpeed}
                  className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-rose-400 hover:text-white border border-neutral-800 hover:border-rose-500/50 transition-all active:scale-95 shadow-sm"
                  title="Click to cycle playback speed (1x → 1.25x → 1.5x → 1.75x → 2x)"
                >
                  {playbackSpeed}x
                </button>

                {/* Toggle Notch Coverage */}
                {isFullscreen && (
                  <button
                    onClick={() => setCoverNotch(!coverNotch)}
                    className={`p-2 rounded-lg transition-colors border ${
                      coverNotch 
                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/40' 
                        : 'text-neutral-400 hover:text-white border-neutral-800'
                    }`}
                    title={coverNotch ? "Cover Notch Active (Edge-to-Edge)" : "Fit to Screen"}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                )}

                {/* Fullscreen Button */}
                <button
                  onClick={() => toggleFullscreen(true)}
                  className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Fullscreen Landscape (Double Tap / F)"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
