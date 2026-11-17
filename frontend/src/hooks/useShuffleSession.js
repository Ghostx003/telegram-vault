import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const VIDEO_SHUFFLE_KEY = 'tg_media_video_shuffle_session';
const PHOTO_SHUFFLE_KEY = 'tg_media_photo_shuffle_session';
const AVOID_REPETITION_KEY = 'tg_media_avoid_repetition';

export function useShuffleSession() {
  const [avoidRepetition, setAvoidRepetitionState] = useState(() => {
    try {
      const saved = localStorage.getItem(AVOID_REPETITION_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [playedVideoIds, setPlayedVideoIds] = useState(() => {
    try {
      const saved = localStorage.getItem(VIDEO_SHUFFLE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [playedPhotoIds, setPlayedPhotoIds] = useState(() => {
    try {
      const saved = localStorage.getItem(PHOTO_SHUFFLE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const prefetchedPhotoRef = useRef(null);
  const isPrefetchingPhotoRef = useRef(false);

  const setAvoidRepetition = (val) => {
    setAvoidRepetitionState(val);
    try {
      localStorage.setItem(AVOID_REPETITION_KEY, JSON.stringify(val));
    } catch (e) {}
  };

  const recordVideoPlayed = useCallback((messageId) => {
    if (!messageId) return;
    setPlayedVideoIds(prev => {
      if (prev.includes(messageId)) return prev;
      const next = [...prev, messageId];
      try {
        localStorage.setItem(VIDEO_SHUFFLE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const recordPhotoViewed = useCallback((messageId) => {
    if (!messageId) return;
    setPlayedPhotoIds(prev => {
      if (prev.includes(messageId)) return prev;
      const next = [...prev, messageId];
      try {
        localStorage.setItem(PHOTO_SHUFFLE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Background pre-fetcher for lightning-fast next photo response
  const prefetchNextPhoto = useCallback(async (customExcludes) => {
    if (isPrefetchingPhotoRef.current) return;
    try {
      isPrefetchingPhotoRef.current = true;
      const exclude = customExcludes !== undefined 
        ? customExcludes 
        : (avoidRepetition ? playedPhotoIds : []);
      const res = await api.getRandomPhoto(exclude);
      if (res.data) {
        prefetchedPhotoRef.current = res.data;
        // Warm browser cache & server disk cache
        const img = new Image();
        img.src = api.getPhotoUrl(res.data.telegram_message_id);
      }
    } catch (e) {
      console.warn('Photo prefetch warning:', e);
    } finally {
      isPrefetchingPhotoRef.current = false;
    }
  }, [avoidRepetition, playedPhotoIds]);

  // Initial prime prefetch on mount
  useEffect(() => {
    prefetchNextPhoto();
  }, [prefetchNextPhoto]);

  const resetVideoSession = useCallback(() => {
    setPlayedVideoIds([]);
    try {
      localStorage.removeItem(VIDEO_SHUFFLE_KEY);
    } catch (e) {}
  }, []);

  const resetPhotoSession = useCallback(() => {
    setPlayedPhotoIds([]);
    prefetchedPhotoRef.current = null;
    try {
      localStorage.removeItem(PHOTO_SHUFFLE_KEY);
    } catch (e) {}
    prefetchNextPhoto([]);
  }, [prefetchNextPhoto]);

  const fetchNextRandomVideo = useCallback(async () => {
    const exclude = avoidRepetition ? playedVideoIds : [];
    const res = await api.getRandomVideo(exclude);
    if (res.data) {
      if (res.resetSession) {
        resetVideoSession();
      }
      recordVideoPlayed(res.data.telegram_message_id);
      return res.data;
    }
    return null;
  }, [avoidRepetition, playedVideoIds, recordVideoPlayed, resetVideoSession]);

  const fetchNextRandomPhoto = useCallback(async () => {
    let chosenPhoto = null;

    // 1. Instant return if pre-fetched buffer is ready!
    if (prefetchedPhotoRef.current) {
      chosenPhoto = prefetchedPhotoRef.current;
      prefetchedPhotoRef.current = null;
    } else {
      // 2. Fetch directly from API
      const exclude = avoidRepetition ? playedPhotoIds : [];
      const res = await api.getRandomPhoto(exclude);
      if (res.data) {
        if (res.resetSession) {
          resetPhotoSession();
        }
        chosenPhoto = res.data;
      }
    }

    if (chosenPhoto) {
      recordPhotoViewed(chosenPhoto.telegram_message_id);
      // Immediately queue the NEXT one in background for the next click
      const nextExcludes = avoidRepetition 
        ? [...playedPhotoIds, chosenPhoto.telegram_message_id] 
        : [];
      setTimeout(() => {
        prefetchNextPhoto(nextExcludes);
      }, 50);
      return chosenPhoto;
    }

    return null;
  }, [avoidRepetition, playedPhotoIds, prefetchNextPhoto, recordPhotoViewed, resetPhotoSession]);

  return {
    avoidRepetition,
    setAvoidRepetition,
    playedVideoIds,
    playedPhotoIds,
    playedVideoCount: playedVideoIds.length,
    playedPhotoCount: playedPhotoIds.length,
    recordVideoPlayed,
    recordPhotoViewed,
    resetVideoSession,
    resetPhotoSession,
    fetchNextRandomVideo,
    fetchNextRandomPhoto,
  };
}
