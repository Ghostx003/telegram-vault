// API Client for Personal Telegram Media Viewer

const API_BASE = '/api';

export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
}

export const api = {
  // Auth
  getAuthStatus: () => fetchJson('/auth/status'),
  sendCode: (phoneNumber, apiHash) => fetchJson('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, apiHash }),
  }),
  verifyCode: (code) => fetchJson('/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),
  verifyPassword: (password) => fetchJson('/auth/verify-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  logout: () => fetchJson('/auth/logout', { method: 'POST' }),

  // Channels Management
  getChannels: () => fetchJson('/channels'),
  addChannel: (data) => fetchJson('/channels', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  selectChannel: (channelId) => fetchJson(`/channels/${channelId}/select`, {
    method: 'POST',
  }),
  deleteChannel: (channelId) => fetchJson(`/channels/${channelId}`, {
    method: 'DELETE',
  }),

  // Sync
  getSyncStatus: () => fetchJson('/sync/status'),
  startSync: (fullBackfill = true, channelId = null) => fetchJson('/sync/start', {
    method: 'POST',
    body: JSON.stringify({ fullBackfill, channelId }),
  }),

  // Videos
  getVideos: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, val);
      }
    });
    return fetchJson(`/videos?${searchParams.toString()}`);
  },
  getRandomVideo: (excludeIds = [], channelId = null) => {
    const params = new URLSearchParams();
    if (excludeIds.length > 0) params.set('excludeIds', excludeIds.join(','));
    if (channelId) params.set('channel_id', channelId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/videos/random${q}`);
  },
  getFeaturedVideo: (channelId = null) => {
    const q = channelId ? `?channel_id=${channelId}` : '';
    return fetchJson(`/videos/featured${q}`);
  },
  getAllVideoIds: (channelId = null) => {
    const q = channelId ? `?channel_id=${channelId}` : '';
    return fetchJson(`/videos/all-ids${q}`);
  },

  // Photos
  getPhotos: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, val);
      }
    });
    return fetchJson(`/photos?${searchParams.toString()}`);
  },
  getRandomPhoto: (excludeIds = [], channelId = null, count = 1) => {
    const params = new URLSearchParams();
    if (excludeIds.length > 0) params.set('excludeIds', excludeIds.join(','));
    if (channelId) params.set('channel_id', channelId);
    if (count > 1) params.set('count', count);
    const q = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/photos/random${q}`);
  },
  getAllPhotoIds: (channelId = null) => {
    const q = channelId ? `?channel_id=${channelId}` : '';
    return fetchJson(`/photos/all-ids${q}`);
  },

  // Media
  getMedia: (id) => fetchJson(`/media/${id}`),
  getMediaStatus: (id) => fetchJson(`/media/${id}/status`),
  recordView: (id) => fetchJson(`/media/${id}/view`, { method: 'POST' }),
  cleanupMedia: (id) => fetchJson(`/media/${id}/cleanup`, { method: 'POST' }),
  toggleStar: (id, channelId = null) => {
    const q = channelId ? `?channel_id=${channelId}` : '';
    return fetchJson(`/media/${id}/star${q}`, { method: 'POST' });
  },

  // Cache Management
  clearCache: (category = 'all') => fetchJson('/media/cache/clear', {
    method: 'POST',
    body: JSON.stringify({ category }),
  }),

  // URLs for streaming and images
  getThumbnailUrl: (id) => `${API_BASE}/media/${id}/thumbnail`,
  getPhotoUrl: (id) => `${API_BASE}/media/${id}/photo`,
  getVideoStreamUrl: (id) => `${API_BASE}/media/${id}/stream`,

  // Stats
  getStats: (channelId = null) => {
    const q = channelId ? `?channel_id=${channelId}` : '';
    return fetchJson(`/stats${q}`);
  },
};
