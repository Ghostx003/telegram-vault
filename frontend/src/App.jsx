import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { SyncIndicator } from './components/SyncIndicator';
import { AuthModal } from './components/AuthModal';
import { ChannelSwitcherModal } from './components/ChannelSwitcherModal';
import { ClearCacheModal } from './components/ClearCacheModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { PhotoLightboxModal } from './components/PhotoLightboxModal';

import { Home } from './pages/Home';
import { Videos } from './pages/Videos';
import { Photos } from './pages/Photos';
import { RandomHub } from './pages/RandomHub';
import { RecentlyAdded } from './pages/RecentlyAdded';
import { StarredMedia } from './pages/StarredMedia';
import { Dices } from 'lucide-react';

import { useTelegramAuth } from './hooks/useTelegramAuth';
import { useSync } from './hooks/useSync';
import { useShuffleSession } from './hooks/useShuffleSession';
import { api } from './api/client';

export function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMediaType, setSelectedMediaType] = useState('videos'); // 'videos' | 'photos'
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);

  // Channels state
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);

  // Active media viewer state
  const [activeVideo, setActiveVideo] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [isOpeningRandomPhoto, setIsOpeningRandomPhoto] = useState(false);

  // Photo viewer mode: 'random' | 'sequential'
  const [photoViewerMode, setPhotoViewerMode] = useState('sequential');
  const photoHistoryRef = useRef([]);

  // Home preview data
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [allVideoIds, setAllVideoIds] = useState([]);
  const [allPhotoIds, setAllPhotoIds] = useState([]);

  // Video play history for previous button
  const videoHistoryRef = useRef([]);

  // Telegram Auth Hook
  const {
    authStatus,
    actionLoading: authLoading,
    error: authError,
    step: authStep,
    setStep: setAuthStep,
    sendCode,
    verifyCode,
    verifyPassword,
    logout,
    refreshStatus: refreshAuthStatus,
  } = useTelegramAuth();

  // Load channels
  const loadChannels = useCallback(async () => {
    try {
      const res = await api.getChannels();
      setChannels(res.channels || []);
      setActiveChannel(res.activeChannel || null);
      return res.activeChannel;
    } catch (err) {
      console.warn('Error loading channels:', err);
      return null;
    }
  }, []);

  // Load home data for active channel
  const loadHomeData = useCallback(async (channelId = null) => {
    try {
      const targetChId = channelId || activeChannel?.id;
      const [featRes, vRes, pRes, vIds, pIds] = await Promise.all([
        api.getFeaturedVideo(targetChId).catch(() => ({ data: null })),
        api.getVideos({ limit: 8, sort: 'newest', channel_id: targetChId }).catch(() => ({ data: [] })),
        api.getPhotos({ limit: 12, sort: 'newest', channel_id: targetChId }).catch(() => ({ data: [] })),
        api.getAllVideoIds(targetChId).catch(() => ({ ids: [] })),
        api.getAllPhotoIds(targetChId).catch(() => ({ ids: [] })),
      ]);

      setFeaturedVideo(featRes.data);
      setRecentVideos(vRes.data || []);
      setRecentPhotos(pRes.data || []);
      setAllVideoIds(vIds.ids || []);
      setAllPhotoIds(pIds.ids || []);
    } catch (err) {
      console.warn('Error loading initial data:', err);
    }
  }, [activeChannel?.id]);

  // Sync Hook
  const { syncData, isSyncing, progress, counts, startSync } = useSync(() => {
    loadChannels();
    loadHomeData();
  });

  const handleStartSync = (fullBackfill = true, channelId = null) => {
    return startSync(fullBackfill, channelId || activeChannel?.id);
  };

  // Shuffle Session Hook
  const {
    avoidRepetition,
    setAvoidRepetition,
    playedVideoIds,
    playedPhotoIds,
    playedVideoCount,
    playedPhotoCount,
    recordVideoPlayed,
    recordPhotoViewed,
    resetVideoSession,
    resetPhotoSession,
    fetchNextRandomVideo,
    fetchNextRandomPhoto,
  } = useShuffleSession();

  // Initial load
  useEffect(() => {
    loadChannels().then(ch => {
      loadHomeData(ch?.id);
    });
  }, [loadChannels, loadHomeData]);

  // Channel Actions
  const handleSelectChannel = async (channelId) => {
    try {
      const res = await api.selectChannel(channelId);
      setActiveChannel(res.activeChannel);
      await loadChannels();
      await loadHomeData(channelId);
      setIsChannelModalOpen(false);
    } catch (err) {
      alert(`Could not switch channel: ${err.message}`);
    }
  };

  const handleAddChannel = async (channelData) => {
    const res = await api.addChannel(channelData);
    if (res.channel) {
      await handleSelectChannel(res.channel.id);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    const res = await api.deleteChannel(channelId);
    if (res.activeChannel) {
      setActiveChannel(res.activeChannel);
    }
    await loadChannels();
    await loadHomeData();
  };

  // Video Player Handlers
  const handlePlayVideo = (video) => {
    if (!video) return;
    recordVideoPlayed(video.telegram_message_id);
    videoHistoryRef.current.push(video);
    setActiveVideo(video);
  };

  const handleCloseVideoPlayer = () => {
    if (activeVideo) {
      // Delete physical video file from disk as requested!
      api.cleanupMedia(activeVideo.telegram_message_id, activeVideo.channel_id).catch(() => {});
    }
    setActiveVideo(null);
  };

  const handlePlayRandomVideo = async () => {
    try {
      const rand = await fetchNextRandomVideo();
      if (rand) {
        handlePlayVideo(rand);
      }
    } catch (e) {
      console.warn('Could not fetch random video:', e);
    }
  };

  const handleNextRandomVideoInPlayer = async () => {
    const previous = activeVideo;
    try {
      const nextRand = await fetchNextRandomVideo();
      if (nextRand) {
        // Cleanup previous video from disk cache
        if (previous?.telegram_message_id) {
          api.cleanupMedia(previous.telegram_message_id, previous.channel_id).catch(() => {});
        }
        handlePlayVideo(nextRand);
      }
    } catch (e) {
      console.warn('Next random video error:', e);
    }
  };

  const handlePrevVideoInPlayer = () => {
    if (videoHistoryRef.current.length > 1) {
      const current = videoHistoryRef.current.pop();
      if (current) {
        api.cleanupMedia(current.telegram_message_id, current.channel_id).catch(() => {});
      }
      const prev = videoHistoryRef.current[videoHistoryRef.current.length - 1];
      if (prev) {
        setActiveVideo(prev);
      }
    }
  };

  // Photo Lightbox Handlers
  const handleViewPhoto = (photo, mode = 'sequential') => {
    if (!photo) return;
    setPhotoViewerMode(mode);
    photoHistoryRef.current.push(photo);
    recordPhotoViewed(photo.telegram_message_id);
    setActivePhoto(photo);
  };

  const handleOpenRandomPhoto = async () => {
    try {
      if (!activePhoto) {
        setIsOpeningRandomPhoto(true);
      }
      const rand = await fetchNextRandomPhoto();
      if (rand) {
        setPhotoViewerMode('random');
        photoHistoryRef.current.push(rand);
        recordPhotoViewed(rand.telegram_message_id);
        setActivePhoto(rand);
      }
    } catch (e) {
      console.warn('Could not fetch random photo:', e);
    } finally {
      setIsOpeningRandomPhoto(false);
    }
  };

  const handleNextPhotoInLightbox = async () => {
    // When opened via pick a random photo:
    // clicking the next button selects a NEW random photo!
    if (photoViewerMode === 'random') {
      try {
        const rand = await fetchNextRandomPhoto();
        if (rand) {
          photoHistoryRef.current.push(rand);
          recordPhotoViewed(rand.telegram_message_id);
          setActivePhoto(rand);
        }
      } catch (e) {
        console.warn('Error fetching next random photo:', e);
      }
      return;
    }

    // Sequential mode fallback
    if (!activePhoto || allPhotoIds.length === 0) return;
    const currentIdx = allPhotoIds.indexOf(activePhoto.telegram_message_id);
    const nextIdx = (currentIdx + 1) % allPhotoIds.length;
    const nextId = allPhotoIds[nextIdx];
    try {
      const res = await api.getMedia(nextId);
      if (res.data) {
        photoHistoryRef.current.push(res.data);
        recordPhotoViewed(res.data.telegram_message_id);
        setActivePhoto(res.data);
      }
    } catch (e) {}
  };

  const handlePrevPhotoInLightbox = async () => {
    if (photoHistoryRef.current.length > 1) {
      photoHistoryRef.current.pop(); // Remove current
      const prev = photoHistoryRef.current[photoHistoryRef.current.length - 1];
      if (prev) {
        setActivePhoto(prev);
        return;
      }
    }

    if (!activePhoto || allPhotoIds.length === 0) return;
    const currentIdx = allPhotoIds.indexOf(activePhoto.telegram_message_id);
    const prevIdx = (currentIdx - 1 + allPhotoIds.length) % allPhotoIds.length;
    const prevId = allPhotoIds[prevIdx];
    try {
      const res = await api.getMedia(prevId);
      if (res.data) {
        setActivePhoto(res.data);
      }
    } catch (e) {}
  };

  // Unified Surprise Me Handler
  const handleSurpriseMe = () => {
    if (activeTab === 'photos' || (activeTab !== 'videos' && selectedMediaType === 'photos')) {
      handleOpenRandomPhoto();
    } else {
      handlePlayRandomVideo();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMediaType={selectedMediaType}
        setSelectedMediaType={setSelectedMediaType}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSurpriseMe={handleSurpriseMe}
        onPlayRandomVideo={handlePlayRandomVideo}
        onOpenRandomPhoto={handleOpenRandomPhoto}
        onStartSync={handleStartSync}
        isSyncing={isSyncing}
        syncProgress={progress}
        authStatus={authStatus}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        counts={counts}
        activeChannel={activeChannel}
        onOpenChannelModal={() => setIsChannelModalOpen(true)}
        onOpenClearCacheModal={() => setIsClearCacheModalOpen(true)}
      />

      {/* Sync Live Progress Banner */}
      <SyncIndicator syncData={syncData} />

      {/* Main Content Area - Full width edge-to-edge */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 xl:px-10 pt-6">
        {activeTab === 'home' && (
          <Home
            featuredVideo={featuredVideo}
            recentVideos={recentVideos}
            recentPhotos={recentPhotos}
            onPlayVideo={handlePlayVideo}
            onViewPhoto={(photo) => handleViewPhoto(photo, 'sequential')}
            onPlayRandomVideo={handlePlayRandomVideo}
            onOpenRandomPhoto={handleOpenRandomPhoto}
            setActiveTab={setActiveTab}
            counts={counts}
            onStartSync={handleStartSync}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'videos' && (
          <Videos
            onPlayVideo={handlePlayVideo}
            onPlayRandomVideo={handlePlayRandomVideo}
            searchTerm={searchTerm}
            avoidRepetition={avoidRepetition}
            onToggleAvoidRepetition={setAvoidRepetition}
          />
        )}

        {activeTab === 'photos' && (
          <Photos
            onViewPhoto={(photo) => handleViewPhoto(photo, 'sequential')}
            onOpenRandomPhoto={handleOpenRandomPhoto}
            searchTerm={searchTerm}
          />
        )}

        {activeTab === 'random' && (
          <RandomHub
            onPlayRandomVideo={handlePlayRandomVideo}
            onOpenRandomPhoto={handleOpenRandomPhoto}
            onPlayVideo={handlePlayVideo}
            onViewPhoto={(photo) => handleViewPhoto(photo, 'sequential')}
            avoidRepetition={avoidRepetition}
            setAvoidRepetition={setAvoidRepetition}
            playedVideoCount={playedVideoCount}
            playedPhotoCount={playedPhotoCount}
            resetVideoSession={resetVideoSession}
            resetPhotoSession={resetPhotoSession}
            counts={counts}
            initialMediaType={selectedMediaType}
          />
        )}

        {activeTab === 'recent' && (
          <RecentlyAdded
            onPlayVideo={handlePlayVideo}
            onViewPhoto={(photo) => handleViewPhoto(photo, 'sequential')}
          />
        )}

        {activeTab === 'starred' && (
          <StarredMedia
            onPlayVideo={handlePlayVideo}
            onViewPhoto={(photo) => handleViewPhoto(photo, 'sequential')}
          />
        )}
      </main>

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          onClose={handleCloseVideoPlayer}
          onNextRandomVideo={handleNextRandomVideoInPlayer}
          onPrevVideo={videoHistoryRef.current.length > 1 ? handlePrevVideoInPlayer : null}
          avoidRepetition={avoidRepetition}
          playedCount={playedVideoCount}
        />
      )}

      {/* Instant Circular Loader when launching Surprise Me photo from outside lightbox */}
      {isOpeningRandomPhoto && !activePhoto && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-fadeIn pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full bg-amber-500/25 blur-xl animate-pulse" />
            <svg className="w-16 h-16 animate-spin text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" viewBox="0 0 50 50">
              <circle className="opacity-20" cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle className="opacity-100" cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="95, 150" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Dices className="w-6 h-6 text-amber-300 animate-spin-slow" />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-neutral-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-amber-200 tracking-wider uppercase">
              Loading Next Surprise Photo...
            </span>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <PhotoLightboxModal
          photo={activePhoto}
          onClose={() => setActivePhoto(null)}
          onNextPhoto={handleNextPhotoInLightbox}
          onPrevPhoto={handlePrevPhotoInLightbox}
          onNextRandomPhoto={handleOpenRandomPhoto}
          isRandomMode={photoViewerMode === 'random'}
          onToggleRandomMode={() => setPhotoViewerMode(m => m === 'random' ? 'sequential' : 'random')}
        />
      )}

      {/* Channel Switcher Modal */}
      <ChannelSwitcherModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        channels={channels}
        activeChannel={activeChannel}
        onSelectChannel={handleSelectChannel}
        onAddChannel={handleAddChannel}
        onDeleteChannel={handleDeleteChannel}
        onStartSync={handleStartSync}
      />

      {/* Clear Cache Modal */}
      <ClearCacheModal
        isOpen={isClearCacheModalOpen}
        onClose={() => setIsClearCacheModalOpen(false)}
        onCacheCleared={() => {
          loadHomeData();
        }}
      />

      {/* Telegram Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authStatus={authStatus}
        step={authStep}
        setStep={setAuthStep}
        sendCode={sendCode}
        verifyCode={verifyCode}
        verifyPassword={verifyPassword}
        logout={logout}
        actionLoading={authLoading}
        error={authError}
        onStartSync={handleStartSync}
      />

    </div>
  );
}

export default App;
