import React, { useState } from 'react';
import { Play, Image as ImageIcon, Film, Eye, Calendar, Sparkles, Maximize2, Star } from 'lucide-react';
import { api } from '../api/client';
import { formatDuration, formatRelativeTime, formatFullDate, truncateText } from '../utils/formatters';

export function MediaCard({ item, onPlayVideo, onViewPhoto, isHighlighted = false }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isVideo = item.media_type === 'video';
  const thumbUrl = api.getThumbnailUrl(item.telegram_message_id);

  const handleClick = () => {
    if (isVideo) {
      if (onPlayVideo) onPlayVideo(item);
    } else {
      if (onViewPhoto) onViewPhoto(item);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col bg-neutral-900/90 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/70 backdrop-blur-sm ${
        isHighlighted 
          ? 'border-rose-500/80 ring-2 ring-rose-500/30' 
          : isVideo
            ? 'border-neutral-800/80 hover:border-rose-500/50'
            : 'border-neutral-800/80 hover:border-amber-500/50'
      }`}
    >
      {/* Media Thumbnail Container */}
      <div className={`relative w-full bg-neutral-950 overflow-hidden flex items-center justify-center ${
        isVideo ? 'aspect-video' : 'aspect-[4/5] min-h-[320px] sm:min-h-[360px]'
      }`}>
        {/* Placeholder skeleton */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center z-0">
            {isVideo ? (
              <Film className="w-8 h-8 text-neutral-800" />
            ) : (
              <ImageIcon className="w-8 h-8 text-neutral-800" />
            )}
          </div>
        )}

        {isVideo ? (
          /* Video Thumbnail - 16:9 Cover */
          <>
            <img
              src={thumbUrl}
              alt={item.caption || item.file_name || 'Telegram video'}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/30 opacity-70 group-hover:opacity-40 transition-opacity" />
          </>
        ) : (
          /* Photo Container - FULL PHOTO SHOWCASE (No cropping!) */
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950">
            {/* Ambient blurred backdrop behind the photo matching its color tones */}
            {imgLoaded && (
              <img
                src={thumbUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-25 scale-110 pointer-events-none"
              />
            )}
            
            {/* Full uncropped photo */}
            <img
              src={thumbUrl}
              alt={item.caption || item.file_name || 'Telegram photo'}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`relative z-10 w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-lg ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Subtle top/bottom edge gradients */}
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
          </div>
        )}

        {/* Center Hover Action Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 pointer-events-none">
          <div className={`w-12 h-12 rounded-full ${
            isVideo ? 'bg-rose-600/90 shadow-rose-950/60' : 'bg-amber-600/90 shadow-amber-950/60'
          } text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform`}>
            {isVideo ? (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Top Badges */}
        {isHighlighted && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-medium flex items-center gap-0.5 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Featured
            </span>
          </div>
        )}

        {/* Starred Badge */}
        {Boolean(item.is_starred) && (
          <div className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/40 text-amber-400 shadow-md">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
          </div>
        )}

        {/* Duration / Resolution Badge */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 z-20">
          {isVideo && item.duration > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-mono font-medium border border-white/10 shadow-sm">
              {formatDuration(item.duration)}
            </span>
          )}
          {!isVideo && item.width > 0 && item.height > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-neutral-300 text-[10px] font-mono border border-white/10 shadow-sm">
              {item.width}×{item.height}
            </span>
          )}
        </div>
      </div>

      {/* Card Content & Details */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2 bg-gradient-to-b from-neutral-900 to-neutral-900/95">
        <div>
          <h3 className="text-xs font-medium text-neutral-200 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
            {item.caption ? truncateText(item.caption, 90) : (item.file_name || `Telegram Media #${item.telegram_message_id}`)}
          </h3>
        </div>

        {/* Metadata Footer */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800/60 font-mono gap-2">
          <span className="flex items-center gap-1.5 min-w-0" title={formatFullDate(item.date)}>
            <Calendar className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] text-neutral-300 truncate">{formatFullDate(item.date)}</span>
          </span>

          {item.views_count > 0 && (
            <span className="flex items-center gap-1 text-neutral-400 flex-shrink-0">
              <Eye className="w-3 h-3 text-neutral-400" />
              {item.views_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
