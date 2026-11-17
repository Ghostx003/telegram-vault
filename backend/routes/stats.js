const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const config = require('../config');

function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          totalSize += stat.size;
          fileCount++;
        }
      }
    }
  } catch (err) {}
  return { totalSize, fileCount };
}

router.get('/', (req, res) => {
  try {
    const active = db.getActiveChannel();
    const channelId = req.query.channel_id || active?.id;

    let whereClause = '';
    let params = [];
    if (channelId && channelId !== 'all') {
      whereClause = 'WHERE channel_id = ?';
      params.push(channelId);
    }

    const counts = db.get(`
      SELECT 
        SUM(CASE WHEN media_type = 'video' THEN 1 ELSE 0 END) as videoCount,
        SUM(CASE WHEN media_type = 'photo' THEN 1 ELSE 0 END) as photoCount,
        COUNT(*) as totalCount
      FROM media
      ${whereClause}
    `, params);

    const recentWhere = whereClause ? `${whereClause} AND` : 'WHERE';
    const recentCounts = db.get(`
      SELECT 
        SUM(CASE WHEN date >= unixepoch() - (7 * 86400) THEN 1 ELSE 0 END) as last7Days,
        SUM(CASE WHEN date >= unixepoch() - (30 * 86400) THEN 1 ELSE 0 END) as last30Days
      FROM media
      ${recentWhere} 1=1
    `, params);

    const thumbsCache = getDirectorySize(config.paths.thumbnails);
    const photosCache = getDirectorySize(config.paths.photos);
    const videosCache = getDirectorySize(config.paths.videos);

    const lastSync = (channelId && channelId !== 'all')
      ? (db.get('SELECT * FROM sync_history WHERE channel_id = ? ORDER BY id DESC LIMIT 1', [channelId]) || db.get('SELECT * FROM sync_history ORDER BY id DESC LIMIT 1'))
      : db.get('SELECT * FROM sync_history ORDER BY id DESC LIMIT 1');

    res.json({
      success: true,
      activeChannel: active,
      media: {
        videos: counts?.videoCount || 0,
        photos: counts?.photoCount || 0,
        total: counts?.totalCount || 0,
        recent7Days: recentCounts?.last7Days || 0,
        recent30Days: recentCounts?.last30Days || 0,
      },
      cache: {
        thumbnails: { count: thumbsCache.fileCount, bytes: thumbsCache.totalSize },
        photos: { count: photosCache.fileCount, bytes: photosCache.totalSize },
        videos: { count: videosCache.fileCount, bytes: videosCache.totalSize },
        totalBytes: thumbsCache.totalSize + photosCache.totalSize + videosCache.totalSize,
      },
      lastSync: lastSync || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
