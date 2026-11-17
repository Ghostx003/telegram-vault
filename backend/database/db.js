const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'telegram_media.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Run initial schema (safe: uses CREATE TABLE IF NOT EXISTS)
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
try {
  db.exec(schema);
} catch (e) {
  // Ignore already existing table errors during migration
}

// -------------------------------------------------------------
// Database Migrations & Integrity Checks
// -------------------------------------------------------------

// 1. Migration: Ensure sync_history has channel_id column
try {
  const syncCols = db.prepare("PRAGMA table_info('sync_history')").all();
  const hasChannelId = syncCols.some(c => c.name === 'channel_id');
  if (!hasChannelId) {
    console.log('[DB Migration] Adding channel_id column to sync_history table...');
    db.exec('ALTER TABLE sync_history ADD COLUMN channel_id TEXT;');
  }
} catch (e) {
  console.warn('[DB Migration] sync_history check:', e.message);
}

// 2. Migration: Ensure media table has composite UNIQUE(channel_id, telegram_message_id)
try {
  const mediaSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='media'").get()?.sql || '';
  if (mediaSql.includes('telegram_message_id INTEGER UNIQUE') || !mediaSql.includes('UNIQUE(channel_id, telegram_message_id)')) {
    console.log('[DB Migration] Migrating media table to composite UNIQUE(channel_id, telegram_message_id)...');
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec(`
      CREATE TABLE IF NOT EXISTS media_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_message_id INTEGER NOT NULL,
        channel_id TEXT NOT NULL,
        media_type TEXT NOT NULL CHECK(media_type IN ('video', 'photo')),
        date INTEGER NOT NULL,
        caption TEXT,
        file_name TEXT,
        mime_type TEXT,
        file_size INTEGER DEFAULT 0,
        width INTEGER DEFAULT 0,
        height INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        thumbnail_path TEXT,
        local_cache_path TEXT,
        message_link TEXT,
        views_count INTEGER DEFAULT 0,
        last_viewed_at INTEGER,
        created_at INTEGER DEFAULT (unixepoch()),
        UNIQUE(channel_id, telegram_message_id)
      );
      INSERT OR IGNORE INTO media_new (
        id, telegram_message_id, channel_id, media_type, date, caption,
        file_name, mime_type, file_size, width, height, duration,
        thumbnail_path, local_cache_path, message_link, views_count,
        last_viewed_at, created_at
      ) SELECT 
        id, telegram_message_id, channel_id, media_type, date, caption,
        file_name, mime_type, file_size, width, height, duration,
        thumbnail_path, local_cache_path, message_link, views_count,
        last_viewed_at, created_at
      FROM media;
      DROP TABLE media;
      ALTER TABLE media_new RENAME TO media;
      CREATE INDEX IF NOT EXISTS idx_media_channel ON media(channel_id);
      CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
      CREATE INDEX IF NOT EXISTS idx_media_date ON media(date DESC);
      CREATE INDEX IF NOT EXISTS idx_media_message_id ON media(telegram_message_id);
      CREATE INDEX IF NOT EXISTS idx_media_channel_type_date ON media(channel_id, media_type, date DESC);
    `);
    db.exec('PRAGMA foreign_keys = ON;');
    console.log('[DB Migration] Media table migrated successfully.');
  }
} catch (e) {
  console.warn('[DB Migration] media migration note:', e.message);
}

// 3. Channels integrity
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      invite_link TEXT,
      is_active INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  const channelCount = db.prepare('SELECT COUNT(*) as c FROM channels').get()?.c || 0;
  if (channelCount === 0) {
    db.prepare(`
      INSERT INTO channels (id, title, invite_link, is_active)
      VALUES (?, ?, ?, 1)
    `).run('-1001269413427', 'xseries', 'https://t.me/+czbDHGQCY1k1YzY1');
  } else {
    // Ensure at least one channel is active
    const active = db.prepare('SELECT id FROM channels WHERE is_active = 1 LIMIT 1').get();
    if (!active) {
      db.prepare('UPDATE channels SET is_active = 1 WHERE rowid = (SELECT rowid FROM channels LIMIT 1)').run();
    }
  }
} catch (err) {
  console.warn('Channel migration note:', err.message);
}

// 4. Migration: Ensure media table has is_starred column
try {
  const mediaCols = db.prepare("PRAGMA table_info('media')").all();
  const hasStarred = mediaCols.some(c => c.name === 'is_starred');
  if (!hasStarred) {
    console.log('[DB Migration] Adding is_starred column to media table...');
    db.exec('ALTER TABLE media ADD COLUMN is_starred INTEGER DEFAULT 0;');
    db.exec('CREATE INDEX IF NOT EXISTS idx_media_starred ON media(is_starred);');
  }
} catch (e) {
  console.warn('[DB Migration] is_starred check:', e.message);
}

const dbHelper = {
  raw: db,

  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },

  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  exec(sql) {
    return db.exec(sql);
  },

  getSetting(key, defaultValue = null) {
    const row = this.get('SELECT value FROM settings WHERE key = ?', [key]);
    return row ? row.value : defaultValue;
  },

  setSetting(key, value) {
    return this.run(
      `INSERT INTO settings (key, value, updated_at) 
       VALUES (?, ?, unixepoch())
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
      [key, String(value)]
    );
  },

  deleteSetting(key) {
    return this.run('DELETE FROM settings WHERE key = ?', [key]);
  },

  // Channels Helpers
  getActiveChannel() {
    let row = this.get('SELECT * FROM channels WHERE is_active = 1 LIMIT 1');
    if (!row) {
      row = this.get('SELECT * FROM channels LIMIT 1');
      if (row) {
        this.run('UPDATE channels SET is_active = 1 WHERE id = ?', [row.id]);
      }
    }
    return row;
  },

  getAllChannels() {
    const channels = this.all('SELECT * FROM channels ORDER BY created_at ASC');
    // Augment with media counts
    return channels.map(ch => {
      const stats = this.get(`
        SELECT 
          SUM(CASE WHEN media_type = 'video' THEN 1 ELSE 0 END) as videos_count,
          SUM(CASE WHEN media_type = 'photo' THEN 1 ELSE 0 END) as photos_count,
          MAX(date) as last_media_date
        FROM media WHERE channel_id = ?
      `, [ch.id]);

      return {
        ...ch,
        is_active: Boolean(ch.is_active),
        videos_count: stats?.videos_count || 0,
        photos_count: stats?.photos_count || 0,
        last_media_date: stats?.last_media_date || null
      };
    });
  },

  setActiveChannel(channelId) {
    const ch = this.get('SELECT * FROM channels WHERE id = ?', [channelId]);
    if (!ch) {
      throw new Error(`Channel with ID ${channelId} not found.`);
    }
    this.run('UPDATE channels SET is_active = 0');
    this.run('UPDATE channels SET is_active = 1 WHERE id = ?', [channelId]);
    this.setSetting('active_channel_id', channelId);
    return this.getActiveChannel();
  },

  addChannel({ id, title, invite_link = '' }) {
    if (!id || !title) {
      throw new Error('Channel ID and Title are required');
    }
    this.run(
      `INSERT INTO channels (id, title, invite_link, is_active)
       VALUES (?, ?, ?, 0)
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, invite_link = excluded.invite_link`,
      [id.trim(), title.trim(), invite_link.trim()]
    );
    return this.get('SELECT * FROM channels WHERE id = ?', [id.trim()]);
  },

  deleteChannel(channelId) {
    const count = this.get('SELECT COUNT(*) as c FROM channels')?.c || 0;
    if (count <= 1) {
      throw new Error('Cannot delete the only channel in your library.');
    }
    const ch = this.get('SELECT * FROM channels WHERE id = ?', [channelId]);
    if (!ch) {
      throw new Error('Channel not found.');
    }
    this.run('DELETE FROM channels WHERE id = ?', [channelId]);
    // If was active, activate another channel
    if (ch.is_active) {
      const next = this.get('SELECT id FROM channels LIMIT 1');
      if (next) {
        this.setActiveChannel(next.id);
      }
    }
    return { success: true };
  },

  // Star / Favorite Media Helpers
  toggleStar(idOrMsgId, channelId = null) {
    let item = null;
    // 1. Try matching by channel_id and telegram_message_id
    if (channelId) {
      item = this.get('SELECT id, is_starred FROM media WHERE telegram_message_id = ? AND channel_id = ? LIMIT 1', [idOrMsgId, channelId]);
    }
    // 2. Try matching by primary key id
    if (!item) {
      item = this.get('SELECT id, is_starred FROM media WHERE id = ? LIMIT 1', [idOrMsgId]);
    }
    // 3. Try matching by active channel + telegram_message_id
    if (!item) {
      const active = this.getActiveChannel();
      if (active?.id) {
        item = this.get('SELECT id, is_starred FROM media WHERE telegram_message_id = ? AND channel_id = ? LIMIT 1', [idOrMsgId, active.id]);
      }
    }
    // 4. Fallback to telegram_message_id alone
    if (!item) {
      item = this.get('SELECT id, is_starred FROM media WHERE telegram_message_id = ? LIMIT 1', [idOrMsgId]);
    }
    if (!item) return null;
    const nextState = item.is_starred ? 0 : 1;
    this.run('UPDATE media SET is_starred = ? WHERE id = ?', [nextState, item.id]);
    return Boolean(nextState);
  },

  isStarred(idOrMsgId, channelId = null) {
    let item = null;
    if (channelId) {
      item = this.get('SELECT is_starred FROM media WHERE telegram_message_id = ? AND channel_id = ? LIMIT 1', [idOrMsgId, channelId]);
    }
    if (!item) {
      item = this.get('SELECT is_starred FROM media WHERE id = ? LIMIT 1', [idOrMsgId]);
    }
    if (!item) {
      item = this.get('SELECT is_starred FROM media WHERE telegram_message_id = ? LIMIT 1', [idOrMsgId]);
    }
    return Boolean(item?.is_starred);
  }
};

module.exports = dbHelper;
