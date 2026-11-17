const express = require('express');
const router = express.Router();
const syncService = require('../services/sync');

router.get('/status', (req, res) => {
  res.json({ success: true, ...syncService.getStatus() });
});

router.post('/start', async (req, res) => {
  try {
    const { fullBackfill = true, channelId = null } = req.body || {};
    const result = await syncService.startSync({ fullBackfill, channelId });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Server-Sent Events for real-time sync progress
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    res.write(`data: ${JSON.stringify(syncService.getStatus())}\n\n`);
  } catch (e) {}

  const onProgress = (progress) => {
    if (!res.writableEnded && !res.destroyed) {
      try {
        res.write(`data: ${JSON.stringify({ isSyncing: syncService.isSyncing, progress })}\n\n`);
      } catch (e) {}
    }
  };

  syncService.on('progress', onProgress);

  const cleanup = () => {
    syncService.off('progress', onProgress);
  };

  req.on('close', cleanup);
  req.on('end', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
});

module.exports = router;
