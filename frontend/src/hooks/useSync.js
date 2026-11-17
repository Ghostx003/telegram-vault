import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

export function useSync(onSyncCompleted) {
  const [syncData, setSyncData] = useState({
    isSyncing: false,
    progress: {
      status: 'idle',
      phase: '',
      messagesScanned: 0,
      photosAdded: 0,
      videosAdded: 0,
    },
    counts: { videos: 0, photos: 0, total: 0 },
  });
  const [error, setError] = useState(null);
  const wasSyncingRef = useRef(false);
  const onSyncCompletedRef = useRef(onSyncCompleted);

  // Keep ref updated without triggering effect re-runs
  useEffect(() => {
    onSyncCompletedRef.current = onSyncCompleted;
  }, [onSyncCompleted]);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getSyncStatus();
      setSyncData(prev => ({
        ...prev,
        ...data,
      }));
    } catch (err) {
      // Ignore background network hiccup
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Setup Server-Sent Events for real-time progress (Connect once on mount)
    let eventSource = null;
    let pollInterval = null;

    try {
      eventSource = new EventSource('/api/sync/events');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setSyncData(prev => {
            const next = { ...prev, ...payload };
            if (wasSyncingRef.current && !next.isSyncing) {
              if (onSyncCompletedRef.current) {
                onSyncCompletedRef.current(next);
              }
            }
            wasSyncingRef.current = next.isSyncing;
            return next;
          });
        } catch (e) {}
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSource = null;
        // Fallback: poll every 10 seconds if SSE disconnects
        if (!pollInterval) {
          pollInterval = setInterval(fetchStatus, 10000);
        }
      };
    } catch (e) {
      console.warn('SSE error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchStatus]);

  const startSync = async (fullBackfill = true, channelId = null) => {
    try {
      setError(null);
      wasSyncingRef.current = true;
      const res = await api.startSync(fullBackfill, channelId);
      setSyncData(prev => ({
        ...prev,
        isSyncing: true,
        progress: res.progress || prev.progress,
      }));
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    syncData,
    isSyncing: syncData.isSyncing,
    progress: syncData.progress,
    counts: syncData.counts,
    error,
    startSync,
    refreshStatus: fetchStatus,
  };
}
