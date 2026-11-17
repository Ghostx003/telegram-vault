const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { clearCachedChannel, resolveChannelEntity, normalizeChannelId } = require('../telegram/channel');
const clientModule = require('../telegram/client');

// GET /api/channels
router.get('/', (req, res) => {
  try {
    const channels = db.getAllChannels();
    const activeChannel = db.getActiveChannel();
    res.json({
      success: true,
      channels,
      activeChannel,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/channels (Add new channel)
router.post('/', async (req, res) => {
  try {
    let { id, title, invite_link } = req.body || {};
    invite_link = invite_link ? invite_link.trim() : '';
    id = id ? id.trim() : '';
    title = title ? title.trim() : '';

    if (!id && !invite_link) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide either a Channel ID (e.g. -100...) or an Invite Link (e.g. https://t.me/+...)' 
      });
    }

    if (id) {
      id = normalizeChannelId(id);
    }

    // Try resolving channel details from Telegram if client is connected
    try {
      const isAuth = await clientModule.isAuthorized();
      if (isAuth) {
        const client = await clientModule.connectClient();
        const entity = await resolveChannelEntity(client, { id, invite_link, title });
        if (entity) {
          const resolvedId = normalizeChannelId(entity);
          if (resolvedId) {
            id = resolvedId;
          }
          if (!title && entity.title) {
            title = entity.title;
          }
        }
      }
    } catch (resolveErr) {
      console.warn('[Channels] Telegram resolve note:', resolveErr.message);
    }

    // Fallbacks if ID or Title not resolved
    if (!id) {
      if (invite_link) {
        id = invite_link.replace('https://t.me/+', 'invite_').replace('https://t.me/joinchat/', 'invite_');
      } else {
        id = `channel_${Date.now()}`;
      }
    }
    if (!title) {
      title = `Channel ${id}`;
    }

    const channel = db.addChannel({ id, title, invite_link });
    res.json({ success: true, channel });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/channels/:id/select (Switch active channel)
router.post('/:id/select', (req, res) => {
  try {
    const channelId = req.params.id;
    const active = db.setActiveChannel(channelId);
    clearCachedChannel();
    res.json({ success: true, activeChannel: active });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/channels/:id
router.delete('/:id', (req, res) => {
  try {
    const channelId = req.params.id;
    const result = db.deleteChannel(channelId);
    clearCachedChannel(channelId);
    res.json({ success: true, ...result, activeChannel: db.getActiveChannel() });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
