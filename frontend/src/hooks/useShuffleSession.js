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

  const photoQueueRef = useRef([]); // Multi-photo pre-downloaded buffer
  const isRefillingQueueRef = useRef(false);

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

  // Multi-photo background pre-fetcher: keeps 3 random photos pre-downloaded in browser memory
  const refillPhotoQueue = useCallback(async () => {
    if (isRefillingQueueRef.current) return;
    if (photoQueueRef.current.length >= 3) return;

    try {
      isRefillingQueueRef.current = true;
      const countNeeded = 3 - photoQueueRef.current.length;
      const queuedIds = photoQueueRef.current.map(p => p.telegram_message_id);
      const exclude = avoidRepetition ? [...playedPhotoIds, ...queuedIds] : [...queuedIds];
      
      const res = await api.getRandomPhoto(exclude, null, countNeeded);
      const items = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);

      for (const item of items) {
        if (!item || photoQueueRef.current.some(p => p.telegram_message_id === item.telegram_message_id)) continue;
        
        // Immediately start downloading high-res photo into browser cache
        const img = new Image();
        img.src = api.getPhotoUrl(item.telegram_message_id);

        // Also preload thumbnail
        const thumb = new Image();
        thumb.src = api.getThumbnailUrl(item.telegram_message_id);

        photoQueueRef.current.push(item);
      }
    } catch (e) {
      console.warn('Photo queue refill warning:', e);
    } finally {
      isRefillingQueueRef.current = false;
    }
  }, [avoidRepetition, playedPhotoIds]);

  // Initial prime prefetch on mount
  useEffect(() => {
    refillPhotoQueue();
  }, [refillPhotoQueue]);

  const resetVideoSession = useCallback(() => {
    setPlayedVideoIds([]);
    try {
      localStorage.removeItem(VIDEO_SHUFFLE_KEY);
    } catch (e) {}
  }, []);

  const resetPhotoSession = useCallback(() => {
    setPlayedPhotoIds([]);
    photoQueueRef.current = [];
    try {
      localStorage.removeItem(PHOTO_SHUFFLE_KEY);
    } catch (e) {}
    refillPhotoQueue();
  }, [refillPhotoQueue]);

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

    // 1. Instant return if pre-fetched buffer has items (0ms!)
    if (photoQueueRef.current.length > 0) {
      chosenPhoto = photoQueueRef.current.shift();
    } else {
      // 2. Fallback: fetch directly from API
      const exclude = avoidRepetition ? playedPhotoIds : [];
      const res = await api.getRandomPhoto(exclude);
      if (res.data) {
        if (res.resetSession) {
          resetPhotoSession();
        }
        chosenPhoto = Array.isArray(res.data) ? res.data[0] : res.data;
      }
    }

    if (chosenPhoto) {
      recordPhotoViewed(chosenPhoto.telegram_message_id);
      // Immediately trigger queue refill in background so there's always 3 photos ahead
      setTimeout(() => {
        refillPhotoQueue();
      }, 50);
      return chosenPhoto;
    }

    return null;
  }, [avoidRepetition, playedPhotoIds, refillPhotoQueue, recordPhotoViewed, resetPhotoSession]);

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
