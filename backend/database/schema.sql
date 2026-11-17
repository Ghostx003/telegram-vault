-- Telegram Media Library Schema

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    invite_link TEXT,
    is_active INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS media (
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

CREATE INDEX IF NOT EXISTS idx_media_channel ON media(channel_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_date ON media(date DESC);
CREATE INDEX IF NOT EXISTS idx_media_message_id ON media(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_media_channel_type_date ON media(channel_id, media_type, date DESC);

CREATE TABLE IF NOT EXISTS sync_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    status TEXT NOT NULL,
    photos_added INTEGER DEFAULT 0,
    videos_added INTEGER DEFAULT 0,
    total_messages_scanned INTEGER DEFAULT 0,
    error_message TEXT
);
