import React, { useState } from 'react';
import { 
  Tv, 
  Film, 
  Image as ImageIcon, 
  Shuffle, 
  Clock, 
  Search, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  Dices, 
  X, 
  Radio, 
  ChevronDown, 
  Trash2,
  Sparkles,
  Star
} from 'lucide-react';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  selectedMediaType = 'videos',
  setSelectedMediaType,
  searchTerm, 
  setSearchTerm, 
  onSurpriseMe,
  onPlayRandomVideo, 
  onOpenRandomPhoto,
  onStartSync, 
  isSyncing, 
  syncProgress, 
  authStatus, 
  onOpenAuth, 
  counts, 
  activeChannel, 
  onOpenChannelModal,
  onOpenClearCacheModal
}) {
  const [showSearchInput, setShowSearchInput] = useState(false);

  const isPhotosSelected = activeTab === 'photos' || (activeTab !== 'videos' && selectedMediaType === 'photos');

  const handleToggleVideos = () => {
    if (setSelectedMediaType) setSelectedMediaType('videos');
    setActiveTab('videos');
  };

  const handleTogglePhotos = () => {
    if (setSelectedMediaType) setSelectedMediaType('photos');
    setActiveTab('photos');
  };

  const handleSurpriseClick = () => {
    if (onSurpriseMe) {
      onSurpriseMe();
    } else if (isPhotosSelected) {
      if (onOpenRandomPhoto) onOpenRandomPhoto();
    } else {
      if (onPlayRandomVideo) onPlayRandomVideo();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/80 transition-all shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Brand & Channel Switcher */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50 group-hover:scale-105 transition-transform duration-200">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight">Telegram</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Vault
                </span>
              </div>
            </div>
          </div>

          {/* Channel Switcher Pill */}
          <button
            onClick={onOpenChannelModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition-all shadow-sm group/ch"
            title="Switch Channel / Manage Channels"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 group-hover/ch:animate-ping" />
            <span className="max-w-[120px] sm:max-w-[170px] truncate">
              {activeChannel?.title || 'Main Channel'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover/ch:text-white transition-transform group-hover/ch:translate-y-0.5" />
          </button>
        </div>

        {/* Desktop Navigation - Clean Modern Layout with Media Toggle */}
        <nav className="hidden lg:flex items-center gap-2">
          {/* Home Link */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'home'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80'
            }`}
          >
            <Tv className={`w-4 h-4 ${activeTab === 'home' ? 'text-rose-400' : 'text-neutral-400'}`} />
            <span>Home</span>
          </button>

          {/* MODERN TOGGLE BUTTON: VIDEOS <-> PHOTOS */}
          <div className="flex items-center p-1 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-inner">
            <button
              onClick={handleToggleVideos}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'videos'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-950/60 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Videos</span>
              {counts?.videos > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'videos' ? 'bg-rose-900/80 text-rose-100' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {counts.videos}
                </span>
              )}
            </button>

            <button
              onClick={handleTogglePhotos}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'photos'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/60 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photos</span>
              {counts?.photos > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'photos' ? 'bg-amber-900/80 text-amber-100' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {counts.photos}
                </span>
              )}
            </button>
          </div>

          {/* Random / Shuffle Hub */}
          <button
            onClick={() => setActiveTab('random')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'random'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80'
            }`}
          >
            <Shuffle className={`w-4 h-4 ${activeTab === 'random' ? 'text-indigo-400' : 'text-neutral-400'}`} />
            <span>Shuffle Hub</span>
          </button>

          {/* Recently Added */}
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'recent'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === 'recent' ? 'text-rose-400' : 'text-neutral-400'}`} />
            <span>Recent</span>
          </button>

          {/* Starred Media */}
          <button
            onClick={() => setActiveTab('starred')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'starred'
                ? 'bg-neutral-800 text-amber-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80'
            }`}
          >
            <Star className={`w-4 h-4 ${activeTab === 'starred' ? 'text-amber-400 fill-amber-400' : 'text-neutral-400'}`} />
            <span>Starred</span>
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex items-center">
            <div className={`flex items-center bg-neutral-900/90 border border-neutral-800 rounded-xl px-2.5 py-1.5 transition-all ${
              showSearchInput ? 'w-44 sm:w-60 border-rose-500/50 ring-1 ring-rose-500/20' : 'w-9 sm:w-48 cursor-pointer'
            }`}>
              <Search 
                className="w-4 h-4 text-neutral-400 flex-shrink-0" 
                onClick={() => setShowSearchInput(true)}
              />
              <input
                type="text"
                placeholder="Search captions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSearchInput(true)}
                className={`bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none ml-2 transition-all ${
                  showSearchInput ? 'w-full block' : 'hidden sm:block w-full'
                }`}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="text-neutral-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* SURPRISE ME BUTTON (Unified Random Picker based on active toggle) */}
          <button
            onClick={handleSurpriseClick}
            title={`Surprise Me: Launch random ${isPhotosSelected ? 'photo' : 'video'}`}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
              isPhotosSelected
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 shadow-amber-950/60 hover:shadow-amber-900/80'
                : 'bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 shadow-rose-950/60 hover:shadow-rose-900/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Surprise Me</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/30 uppercase tracking-wider hidden sm:inline">
              {isPhotosSelected ? 'Photo' : 'Video'}
            </span>
          </button>

          {/* Sync / Refresh Button */}
          <button
            onClick={() => onStartSync(false)}
            disabled={isSyncing}
            title={isSyncing ? `Syncing: ${syncProgress?.phase || 'In progress...'}` : 'Sync Library with Channel'}
            className={`p-2 rounded-xl border border-neutral-800 transition-all ${
              isSyncing 
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 cursor-not-allowed'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-rose-400' : ''}`} />
          </button>

          {/* Clear Cache Button */}
          <button
            onClick={onOpenClearCacheModal}
            className="p-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
            title="Clear Storage Cache"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Telegram Connection Pill */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              authStatus?.authenticated
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/50'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-400 hover:bg-amber-950/50'
            }`}
          >
            {authStatus?.authenticated ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">{authStatus.user?.firstName || 'Connected'}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Connect</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Bar with Toggle Button */}
      <div className="lg:hidden flex items-center justify-between border-t border-neutral-900 bg-neutral-950/95 px-3 py-2 gap-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'home' ? 'text-rose-400' : 'text-neutral-400'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Home</span>
        </button>

        {/* Mobile Media Toggle */}
        <div className="flex items-center p-0.5 bg-neutral-900 border border-neutral-800 rounded-xl">
          <button
            onClick={handleToggleVideos}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'videos' ? 'bg-rose-600 text-white shadow-sm' : 'text-neutral-400'
            }`}
          >
            Videos
          </button>
          <button
            onClick={handleTogglePhotos}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'photos' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-400'
            }`}
          >
            Photos
          </button>
        </div>

        <button
          onClick={() => setActiveTab('random')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'random' ? 'text-indigo-400' : 'text-neutral-400'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Shuffle</span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'recent' ? 'text-rose-400' : 'text-neutral-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Recent</span>
        </button>

        <button
          onClick={() => setActiveTab('starred')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'starred' ? 'text-amber-400' : 'text-neutral-400'
          }`}
        >
          <Star className={`w-4 h-4 ${activeTab === 'starred' ? 'fill-amber-400' : ''}`} />
          <span>Starred</span>
        </button>
      </div>
    </header>
  );
}
