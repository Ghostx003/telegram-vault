const express = require('express');
const router = express.Router();
const fs = require('fs');
const db = require('../database/db');
const cacheService = require('../services/cache');

// POST /api/media/cache/clear (Clear all cache)
router.post('/cache/clear', (req, res) => {
  try {
    const { category = 'all' } = req.body || {};
    const result = cacheService.clearAllCache(category);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/media/:id/status
router.get('/:id/status', (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    const channelId = req.query.channel_id;
    let item = null;
    if (channelId) {
      item = db.get('SELECT file_name FROM media WHERE telegram_message_id = ? AND channel_id = ?', [messageId, channelId]);
    }
    if (!item) {
      item = db.get('SELECT file_name, channel_id FROM media WHERE telegram_message_id = ?', [messageId]);
    }
    const isCached = cacheService.isVideoCached(messageId, item?.file_name, item?.channel_id || channelId);
    res.json({ success: true, status: isCached ? 'cached' : 'streaming' });
  } catch (err) {
    res.json({ success: true, status: 'streaming' });
  }
});

// GET /api/media/:id (metadata)
router.get('/:id', (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    const channelId = req.query.channel_id;
    let item = null;
    if (channelId) {
      item = db.get('SELECT * FROM media WHERE telegram_message_id = ? AND channel_id = ?', [messageId, channelId]);
    }
    if (!item) {
      item = db.get('SELECT * FROM media WHERE telegram_message_id = ?', [messageId]);
    }
    if (!item) {
      item = db.get('SELECT * FROM media WHERE id = ?', [messageId]);
    }
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/media/:id/thumbnail
router.get('/:id/thumbnail', async (req, res) => {
  const messageId = parseInt(req.params.id, 10);
  const channelId = req.query.channel_id || null;
  try {
    const thumbPath = await cacheService.getOrFetchThumbnail(messageId, channelId);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(thumbPath);
  } catch (err) {
    console.error(`[Media] Error serving thumbnail for msg ${messageId}:`, err.message);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="#171717">
        <rect width="400" height="300" fill="#171717"/>
        <circle cx="200" cy="150" r="36" fill="#262626"/>
        <path d="M190 135 L218 150 L190 165 Z" fill="#737373"/>
      </svg>
    `);
  }
});

// GET /api/media/:id/photo
router.get('/:id/photo', async (req, res) => {
  const messageId = parseInt(req.params.id, 10);
  const channelId = req.query.channel_id || null;
  try {
    const photoPath = await cacheService.getOrFetchPhoto(messageId, channelId);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(photoPath);
  } catch (err) {
    console.error(`[Media] Error serving photo for msg ${messageId}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/media/:id/cleanup (Delete physical video file when closed)
router.post('/:id/cleanup', (req, res) => {
  const messageId = parseInt(req.params.id, 10);
  const result = cacheService.deleteVideoCache(messageId);
  res.json({ success: true, ...result });
});

// GET /api/media/:id/stream (Progressive instant streaming with Range requests)
router.get('/:id/stream', async (req, res) => {
  const messageId = parseInt(req.params.id, 10);
  const channelId = req.query.channel_id;
  let item = null;
  if (channelId) {
    item = db.get('SELECT * FROM media WHERE telegram_message_id = ? AND channel_id = ?', [messageId, channelId]);
  }
  if (!item) {
    item = db.get('SELECT * FROM media WHERE telegram_message_id = ?', [messageId]);
  }

  if (!item) {
    return res.status(404).json({ success: false, error: 'Video media item not found' });
  }

  try {
    await cacheService.streamVideoProgressive(req, res, messageId, item);
  } catch (err) {
    console.error(`[Media] Streaming error for msg ${messageId}:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// POST /api/media/:id/view (record view)
router.post('/:id/view', (req, res) => {
  const messageId = parseInt(req.params.id, 10);
  try {
    db.run(
      'UPDATE media SET views_count = views_count + 1, last_viewed_at = unixepoch() WHERE telegram_message_id = ?',
      [messageId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
