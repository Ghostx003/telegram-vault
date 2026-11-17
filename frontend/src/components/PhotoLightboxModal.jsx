import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Dices, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ExternalLink, 
  Download, 
  Calendar,
  Sparkles,
  Info,
  Shuffle,
  MousePointer,
  Star,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { formatDate } from '../utils/formatters';

export function PhotoLightboxModal({ 
  photo, 
  onClose, 
  onNextPhoto, 
  onPrevPhoto, 
  onNextRandomPhoto,
  isRandomMode = false,
  onToggleRandomMode
}) {
  const [zoom, setZoom] = useState(1);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [scrollHintVisible, setScrollHintVisible] = useState(true);
  const [isStarred, setIsStarred] = useState(Boolean(photo?.is_starred));
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setIsStarred(Boolean(photo?.is_starred));
  }, [photo?.telegram_message_id, photo?.is_starred]);

  useEffect(() => {
    // Reset zoom and error states when photo changes
    setZoom(1);
    setFullImageLoaded(false);
    setThumbnailLoaded(false);
    setImgError(false);
  }, [photo?.telegram_message_id]);

  const handleToggleStar = async () => {
    try {
      const next = !isStarred;
      setIsStarred(next);
      if (photo) photo.is_starred = next ? 1 : 0;
      await api.toggleStar(photo.id || photo.telegram_message_id, photo.channel_id);
    } catch (e) {
      console.warn('Star toggle error:', e);
    }
  };
  
  const lastWheelTime = useRef(0);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  // Hide scroll hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setScrollHintVisible(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [photo?.telegram_message_id]);

  const handleNextRandomClick = useCallback(async () => {
    if (isFetchingNext) return;
    try {
      setIsFetchingNext(true);
      if (onNextRandomPhoto) {
        await onNextRandomPhoto();
      }
    } catch (e) {
      console.warn('Error fetching random photo:', e);
    } finally {
      setIsFetchingNext(false);
    }
  }, [isFetchingNext, onNextRandomPhoto]);

  const handleNextClick = useCallback(async () => {
    if (isFetchingNext) return;
    if (isRandomMode) {
      await handleNextRandomClick();
    } else if (onNextPhoto) {
      try {
        setIsFetchingNext(true);
        await onNextPhoto();
      } catch (e) {
        console.warn('Error fetching next photo:', e);
      } finally {
        setIsFetchingNext(false);
      }
    }
  }, [isFetchingNext, isRandomMode, handleNextRandomClick, onNextPhoto]);

  const handlePrevClick = useCallback(async () => {
    if (isFetchingNext) return;
    if (onPrevPhoto) {
      try {
        setIsFetchingNext(true);
        await onPrevPhoto();
      } catch (e) {
        console.warn('Error fetching previous photo:', e);
      } finally {
        setIsFetchingNext(false);
      }
    }
  }, [isFetchingNext, onPrevPhoto]);

  // Mouse wheel scroll handler to switch photo
  const handleWheel = useCallback((e) => {
    if (zoom > 1) return;

    const now = Date.now();
    if (now - lastWheelTime.current < 350) return; // 350ms debounce

    if (e.deltaY > 25) {
      // Scrolled down -> Switch to next photo (or next random photo)
      lastWheelTime.current = now;
      handleNextClick();
    } else if (e.deltaY < -25) {
      // Scrolled up -> Switch to previous photo
      lastWheelTime.current = now;
      handlePrevClick();
    }
  }, [zoom, handleNextClick, handlePrevClick]);

  // Touch swipe support for touchscreens / trackpads
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (zoom > 1) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNextClick();
      } else if (deltaX > 0) {
        handlePrevClick();
      }
    }
    // Vertical swipe
    else if (Math.abs(deltaY) > 60) {
      if (deltaY < 0) {
        handleNextClick();
      } else if (deltaY > 0) {
        handlePrevClick();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextClick();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevClick();
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNextRandomClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNextClick, handlePrevClick, handleNextRandomClick]);

  if (!photo) return null;

  const photoUrl = api.getPhotoUrl(photo.telegram_message_id, photo.channel_id);

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25));
  const handleResetZoom = () => setZoom(1);

  return (
    <div 
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fadeIn select-none"
    >
      
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800/80 transition-colors shadow-lg"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-white truncate max-w-xl">
              {photo.caption || photo.file_name || `Photo #${photo.telegram_message_id}`}
            </h2>
            <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono mt-0.5">
              <span>{formatDate(photo.date)}</span>
              <span>•</span>
              <span>Msg #{photo.telegram_message_id}</span>
              {photo.width > 0 && photo.height > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400/90">{photo.width} × {photo.height}</span>
                </>
              )}
              {!fullImageLoaded && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Loading HD...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Star / Favorite Button */}
          <button
            onClick={handleToggleStar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isStarred
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/40'
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title={isStarred ? "Remove from Starred" : "Star this Photo (Save to Starred Media)"}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-neutral-400'}`} />
            <span className="hidden sm:inline">{isStarred ? 'Starred' : 'Star'}</span>
          </button>
          
          {/* Mode Toggle Pill (Random Mode vs Sequential Mode) */}
          {onToggleRandomMode && (
            <button
              onClick={onToggleRandomMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isRandomMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/40'
                  : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={isRandomMode ? "Random Mode Active (Clicking Next picks a random photo)" : "Sequential Mode (Clicking Next picks next channel photo)"}
            >
              <Dices className={`w-3.5 h-3.5 ${isRandomMode ? 'text-amber-400 animate-spin-slow' : ''}`} />
              <span className="hidden sm:inline">
                {isRandomMode ? 'Random Mode: ON' : 'Sequential Mode'}
              </span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-neutral-900/80 border border-neutral-800 rounded-xl p-1 gap-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 text-xs font-mono text-neutral-300 hover:text-white"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Random Photo Button / Surprise Me */}
          <button
            onClick={handleNextRandomClick}
            disabled={isFetchingNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-80"
            title="Pick a New Random Photo (N)"
          >
            {isFetchingNext ? (
              <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <Dices className="w-4 h-4 animate-spin-slow" />
            )}
            <span className="hidden sm:inline">Surprise Me</span>
          </button>

          {/* Telegram message link */}
          {photo.message_link && (
            <a
              href={photo.message_link}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
              title="View in Telegram"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Image Container */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-12 w-full h-full overflow-hidden">
        
        {/* Instant Visible Thumbnail Preview */}
        {api.getThumbnailUrl(photo.telegram_message_id) && (
          <img
            src={api.getThumbnailUrl(photo.telegram_message_id)}
            alt=""
            aria-hidden="true"
            onLoad={() => setThumbnailLoaded(true)}
            className={`absolute max-w-full max-h-[85vh] object-contain transition-opacity duration-300 pointer-events-none ${
              fullImageLoaded ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
            }`}
          />
        )}

        {/* High-Resolution Full Image */}
        <img
          key={photo.telegram_message_id}
          src={photoUrl}
          alt={photo.caption || 'Telegram photo'}
          onLoad={() => {
            setFullImageLoaded(true);
          }}
          onError={() => {
            setFullImageLoaded(false);
            setImgError(true);
          }}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
          className={`relative z-10 max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-opacity duration-300 ${
            fullImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Subtle circular spinner only if neither thumbnail nor full image has loaded yet */}
        {!thumbnailLoaded && !fullImageLoaded && !imgError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Error Fallback */}
        {imgError && !fullImageLoaded && !thumbnailLoaded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <p className="text-sm font-semibold text-white">Could not load this photograph</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">The high-res image might still be downloading from Telegram.</p>
            <button
              onClick={handleNextRandomClick}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-950/50"
            >
              Try Another Random Photo
            </button>
          </div>
        )}

        {/* Previous Button */}
        {onPrevPhoto && (
          <button
            onClick={handlePrevClick}
            disabled={isFetchingNext}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 z-20 group disabled:opacity-50"
            title="Previous Photo (Left Arrow / Scroll Up)"
          >
            {isFetchingNext ? (
              <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            )}
          </button>
        )}

        {/* Next Button - Selects next random photo when in random mode! */}
        {(onNextPhoto || onNextRandomPhoto) && (
          <button
            onClick={handleNextClick}
            disabled={isFetchingNext}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full text-white shadow-2xl transition-all hover:scale-110 active:scale-95 z-20 group border disabled:opacity-50 ${
              isRandomMode 
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-400/50 ring-4 ring-amber-500/20' 
                : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700/80'
            }`}
            title={isRandomMode ? "Next Random Photo (Right Arrow / Scroll Down / N)" : "Next Photo (Right Arrow / Scroll Down)"}
          >
            {isFetchingNext ? (
              <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        )}

        {/* Floating Scroll Gesture Hint */}
        {scrollHintVisible && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-700/80 text-neutral-300 text-xs shadow-xl backdrop-blur-md animate-bounce pointer-events-none">
            <MousePointer className="w-3.5 h-3.5 text-amber-400" />
            <span>Scroll wheel or arrow keys to switch photo</span>
            {isRandomMode && <span className="text-amber-400 font-bold">• Random ON</span>}
          </div>
        )}
      </div>

      {/* Bottom Caption Bar */}
      {photo.caption && (
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-neutral-200 text-xs leading-relaxed max-h-36 overflow-y-auto backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between mb-1 text-[10px] text-neutral-400 font-mono">
              <span className="text-amber-400 font-semibold">PHOTO CAPTION</span>
              <span>Msg #{photo.telegram_message_id}</span>
            </div>
            <p className="whitespace-pre-wrap">{photo.caption}</p>
          </div>
        </div>
      )}

    </div>
  );
}
