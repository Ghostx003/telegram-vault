import React from 'react';
import { Play, Dices, Film, Image as ImageIcon, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { formatDuration, formatDate } from '../utils/formatters';

export function FeaturedHero({ featuredVideo, onPlayVideo, onPlayRandomVideo, counts }) {
  const thumbUrl = featuredVideo ? api.getThumbnailUrl(featuredVideo.telegram_message_id, featuredVideo.channel_id) : null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800/80 shadow-2xl mb-10 group">
      {/* Background Media Backdrop */}
      {thumbUrl ? (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={thumbUrl}
            alt="Featured video backdrop"
            className="w-full h-full object-cover object-center filter blur-xl opacity-30 scale-110 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950 via-rose-950/20 to-neutral-900" />
      )}

      {/* Hero Content */}
      <div className="relative z-10 p-4 sm:p-8 lg:p-12 flex flex-col justify-between min-h-[240px] sm:min-h-[340px] lg:min-h-[420px]">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] sm:text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
            Featured
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-300 text-[10px] sm:text-xs font-medium backdrop-blur-md">
            Private Channel
          </div>
        </div>

        {/* Center Details */}
        <div className="max-w-2xl space-y-2 sm:space-y-3.5 my-3 sm:my-5">
          <h1 className="text-lg sm:text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 sm:line-clamp-3">
            {featuredVideo?.caption || 'Personal Telegram Media Vault'}
          </h1>

          <p className="text-xs sm:text-base text-neutral-300 line-clamp-2 leading-relaxed">
            {featuredVideo ? (
              featuredVideo.caption ? featuredVideo.caption : 'Directly stream or shuffle through high-definition videos and photos from your private channel.'
            ) : (
              'Connect your Telegram account to sync, stream and randomly shuffle photos and videos from your private channel.'
            )}
          </p>

          {featuredVideo && (
            <div className="flex items-center gap-3 text-[10px] sm:text-sm text-neutral-400 font-mono">
              {featuredVideo.duration > 0 && (
                <span className="flex items-center gap-1 text-white bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
                  {formatDuration(featuredVideo.duration)}
                </span>
              )}
              <span>{formatDate(featuredVideo.date)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons & Library Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/60">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {featuredVideo && (
              <button
                onClick={() => onPlayVideo(featuredVideo)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-rose-950/60 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                <span>Watch Featured</span>
              </button>
            )}

            <button
              onClick={onPlayRandomVideo}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm border border-neutral-700/80 shadow-lg hover:border-neutral-600 hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
            >
              <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              <span>Random</span>
            </button>
          </div>

          {/* Quick Counter Pills */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold text-white">{counts?.videos || 0}</span> Videos
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-white">{counts?.photos || 0}</span> Photos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
