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
  MousePointer
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
  
  const lastWheelTime = useRef(0);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    // Reset zoom when photo changes
    setZoom(1);
  }, [photo?.telegram_message_id]);

  // Hide scroll hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setScrollHintVisible(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [photo?.telegram_message_id]);

  // Mouse wheel scroll handler to switch photo
  const handleWheel = useCallback((e) => {
    // Don't switch if zoomed in
    if (zoom > 1) return;

    const now = Date.now();
    if (now - lastWheelTime.current < 350) return; // 350ms debounce

    if (e.deltaY > 25) {
      // Scrolled down -> Switch to next photo (or next random photo)
      lastWheelTime.current = now;
      if (onNextPhoto) {
        onNextPhoto();
      }
    } else if (e.deltaY < -25) {
      // Scrolled up -> Switch to previous photo
      lastWheelTime.current = now;
      if (onPrevPhoto) {
        onPrevPhoto();
      }
    }
  }, [zoom, onNextPhoto, onPrevPhoto]);

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
      if (deltaX < 0 && onNextPhoto) {
        onNextPhoto();
      } else if (deltaX > 0 && onPrevPhoto) {
        onPrevPhoto();
      }
    }
    // Vertical swipe
    else if (Math.abs(deltaY) > 60) {
      if (deltaY < 0 && onNextPhoto) {
        onNextPhoto();
      } else if (deltaY > 0 && onPrevPhoto) {
        onPrevPhoto();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'Escape') onClose();
      if ((e.key === 'ArrowRight' || e.key === ' ') && onNextPhoto) {
        e.preventDefault();
        onNextPhoto();
      }
      if (e.key === 'ArrowLeft' && onPrevPhoto) {
        e.preventDefault();
        onPrevPhoto();
      }
      if ((e.key === 'n' || e.key === 'N') && onNextRandomPhoto) {
        e.preventDefault();
        onNextRandomPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNextPhoto, onPrevPhoto, onNextRandomPhoto]);

  if (!photo) return null;

  const photoUrl = api.getPhotoUrl(photo.telegram_message_id);

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
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
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

          {/* Random Photo Button */}
          <button
            onClick={onNextRandomPhoto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/50 transition-all hover:scale-105 active:scale-95"
            title="Pick a New Random Photo (N)"
          >
            <Dices className="w-4 h-4" />
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
        
        {/* Full Image */}
        <img
          src={photoUrl}
          alt={photo.caption || 'Telegram photo'}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
        />

        {/* Previous Button */}
        {onPrevPhoto && (
          <button
            onClick={onPrevPhoto}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 z-20 group"
            title="Previous Photo (Left Arrow / Scroll Up)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Next Button - Selects next random photo when in random mode! */}
        {onNextPhoto && (
          <button
            onClick={onNextPhoto}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full text-white shadow-2xl transition-all hover:scale-110 active:scale-95 z-20 group border ${
              isRandomMode 
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-400/50 ring-4 ring-amber-500/20' 
                : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700/80'
            }`}
            title={isRandomMode ? "Next Random Photo (Right Arrow / Scroll Down)" : "Next Photo (Right Arrow / Scroll Down)"}
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
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
