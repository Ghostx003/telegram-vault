const express = require('express');
const router = express.Router();
const db = require('../database/db');
const config = require('../config');

function getActiveChannelId(req) {
  if (req.query.channel_id) return req.query.channel_id;
  const active = db.getActiveChannel();
  return active?.id || config.telegram.channelId;
}

// GET /api/videos
// Query params: page, limit, sort, search, startDate, endDate, channel_id
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 24));
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'newest';
    const search = req.query.search ? req.query.search.trim() : '';
    const startDate = req.query.startDate ? parseInt(req.query.startDate, 10) : null;
    const endDate = req.query.endDate ? parseInt(req.query.endDate, 10) : null;
    const channelId = getActiveChannelId(req);

    let whereClauses = ["media_type = 'video'"];
    let params = [];

    if (channelId && channelId !== 'all') {
      whereClauses.push('channel_id = ?');
      params.push(channelId);
    }

    if (search) {
      whereClauses.push('(caption LIKE ? OR file_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (startDate) {
      whereClauses.push('date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('date <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderBy = 'date DESC';
    if (sort === 'oldest') orderBy = 'date ASC';
    else if (sort === 'random') orderBy = 'RANDOM()';
    else if (sort === 'duration_desc') orderBy = 'duration DESC, date DESC';
    else if (sort === 'duration_asc') orderBy = 'duration ASC, date DESC';
    else if (sort === 'views') orderBy = 'views_count DESC, date DESC';

    const countRow = db.get(`SELECT COUNT(*) as total FROM media ${whereSql}`, params);
    const total = countRow ? countRow.total : 0;

    const items = db.all(
      `SELECT * FROM media ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/videos/random
router.get('/random', (req, res) => {
  try {
    const count = Math.min(50, Math.max(1, parseInt(req.query.count, 10) || 1));
    const channelId = getActiveChannelId(req);
    let excludeIds = [];

    if (req.query.excludeIds) {
      try {
        if (typeof req.query.excludeIds === 'string') {
          excludeIds = req.query.excludeIds.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean);
        }
      } catch (e) {}
    }

    let whereClause = "media_type = 'video'";
    let params = [];

    if (channelId && channelId !== 'all') {
      whereClause += ' AND channel_id = ?';
      params.push(channelId);
    }

    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      whereClause += ` AND telegram_message_id NOT IN (${placeholders})`;
      params.push(...excludeIds);
    }

    let items = db.all(
      `SELECT * FROM media WHERE ${whereClause} ORDER BY RANDOM() LIMIT ?`,
      [...params, count]
    );

    let resetSession = false;
    // If pool is exhausted by excludeIds, reset and pick from full active channel library
    if (items.length === 0 && excludeIds.length > 0) {
      resetSession = true;
      let baseWhere = "media_type = 'video'";
      let baseParams = [];
      if (channelId && channelId !== 'all') {
        baseWhere += ' AND channel_id = ?';
        baseParams.push(channelId);
      }
      items = db.all(`SELECT * FROM media WHERE ${baseWhere} ORDER BY RANDOM() LIMIT ?`, [...baseParams, count]);
    }

    res.json({
      success: true,
      data: count === 1 ? (items[0] || null) : items,
      resetSession,
      count: items.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/videos/featured
router.get('/featured', (req, res) => {
  try {
    const channelId = getActiveChannelId(req);
    let whereClause = "media_type = 'video'";
    let params = [];

    if (channelId && channelId !== 'all') {
      whereClause += ' AND channel_id = ?';
      params.push(channelId);
    }

    let featured = db.get(`SELECT * FROM media WHERE ${whereClause} AND duration >= 10 ORDER BY RANDOM() LIMIT 1`, params);
    if (!featured) {
      featured = db.get(`SELECT * FROM media WHERE ${whereClause} ORDER BY date DESC LIMIT 1`, params);
    }
    res.json({ success: true, data: featured || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/videos/all-ids
router.get('/all-ids', (req, res) => {
  try {
    const channelId = getActiveChannelId(req);
    let whereClause = "media_type = 'video'";
    let params = [];

    if (channelId && channelId !== 'all') {
      whereClause += ' AND channel_id = ?';
      params.push(channelId);
    }

    const rows = db.all(`SELECT telegram_message_id FROM media WHERE ${whereClause} ORDER BY date DESC`, params);
    const ids = rows.map(r => r.telegram_message_id);
    res.json({ success: true, ids, total: ids.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
