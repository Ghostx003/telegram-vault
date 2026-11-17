import { useState, useEffect, useCallback } from 'react';
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

  const resetVideoSession = useCallback(() => {
    setPlayedVideoIds([]);
    try {
      localStorage.removeItem(VIDEO_SHUFFLE_KEY);
    } catch (e) {}
  }, []);

  const resetPhotoSession = useCallback(() => {
    setPlayedPhotoIds([]);
    try {
      localStorage.removeItem(PHOTO_SHUFFLE_KEY);
    } catch (e) {}
  }, []);

  const fetchNextRandomVideo = useCallback(async () => {
    const exclude = avoidRepetition ? playedVideoIds : [];
    const res = await api.getRandomVideo(exclude);
    if (res.data) {
      if (res.resetSession) {
        // Pool was exhausted, reset
        resetVideoSession();
      }
      recordVideoPlayed(res.data.telegram_message_id);
      return res.data;
    }
    return null;
  }, [avoidRepetition, playedVideoIds, recordVideoPlayed, resetVideoSession]);

  const fetchNextRandomPhoto = useCallback(async () => {
    const exclude = avoidRepetition ? playedPhotoIds : [];
    const res = await api.getRandomPhoto(exclude);
    if (res.data) {
      if (res.resetSession) {
        resetPhotoSession();
      }
      recordPhotoViewed(res.data.telegram_message_id);
      return res.data;
    }
    return null;
  }, [avoidRepetition, playedPhotoIds, recordPhotoViewed, resetPhotoSession]);

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
