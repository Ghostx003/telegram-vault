const EventEmitter = require('events');
const clientModule = require('../telegram/client');
const { resolveChannelEntity } = require('../telegram/channel');
const { extractMediaMetadata } = require('../telegram/media');
const db = require('../database/db');

class SyncService extends EventEmitter {
  constructor() {
    super();
    this.isSyncing = false;
    this.currentProgress = {
      status: 'idle', // 'idle' | 'syncing' | 'completed' | 'error'
      phase: '',
      messagesScanned: 0,
      photosAdded: 0,
      videosAdded: 0,
      currentMessageId: 0,
      channelTitle: '',
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    };
  }

  getStatus(channelId = null) {
    const targetChannel = channelId 
      ? db.get('SELECT * FROM channels WHERE id = ?', [channelId])
      : db.getActiveChannel();
    const activeChannel = db.getActiveChannel();
    const chId = targetChannel?.id || activeChannel?.id || '';

    const lastSync = db.get('SELECT * FROM sync_history WHERE channel_id = ? ORDER BY id DESC LIMIT 1', [chId]) ||
                     db.get('SELECT * FROM sync_history ORDER BY id DESC LIMIT 1');

    const counts = db.get(`
      SELECT 
        SUM(CASE WHEN media_type = 'video' THEN 1 ELSE 0 END) as videoCount,
        SUM(CASE WHEN media_type = 'photo' THEN 1 ELSE 0 END) as photoCount,
        COUNT(*) as totalCount
      FROM media
      WHERE channel_id = ?
    `, [chId]);

    return {
      isSyncing: this.isSyncing,
      progress: this.currentProgress,
      activeChannel,
      targetChannel: targetChannel || activeChannel,
      lastSync: lastSync || null,
      counts: {
        videos: counts?.videoCount || 0,
        photos: counts?.photoCount || 0,
        total: counts?.totalCount || 0,
      }
    };
  }

  async startSync(options = { fullBackfill: true, channelId: null }) {
    if (this.isSyncing) {
      return { message: 'Sync already in progress', status: this.currentProgress };
    }

    const isAuth = await clientModule.isAuthorized();
    if (!isAuth) {
      throw new Error('Telegram is not authenticated. Please log in first.');
    }

    const activeChannel = options.channelId 
      ? db.get('SELECT * FROM channels WHERE id = ?', [options.channelId])
      : db.getActiveChannel();

    if (!activeChannel) {
      throw new Error('No channel selected to synchronize.');
    }

    this.isSyncing = true;
    this.currentProgress = {
      status: 'syncing',
      phase: `Connecting to Telegram and resolving ${activeChannel.title}...`,
      channelTitle: activeChannel.title,
      messagesScanned: 0,
      photosAdded: 0,
      videosAdded: 0,
      currentMessageId: 0,
      errorMessage: null,
      startedAt: Date.now(),
      completedAt: null,
    };
    this.emit('progress', this.currentProgress);

    const syncRecord = db.run(
      'INSERT INTO sync_history (started_at, status, channel_id) VALUES (?, ?, ?)',
      [Math.floor(Date.now() / 1000), 'in_progress', activeChannel.id]
    );
    const syncHistoryId = syncRecord.lastInsertRowid;

    // Run async in background
    (async () => {
      try {
        const client = await clientModule.connectClient();
        const channelEntity = await resolveChannelEntity(client, activeChannel);

        console.log(`[Sync] Starting synchronization for channel: ${channelEntity.title || activeChannel.title} (${activeChannel.id})`);

        // Check latest and oldest known IDs in DB for this channel
        const latestMedia = db.get('SELECT MAX(telegram_message_id) as maxId FROM media WHERE channel_id = ?', [activeChannel.id]);
        const oldestMedia = db.get('SELECT MIN(telegram_message_id) as minId FROM media WHERE channel_id = ?', [activeChannel.id]);
        const maxKnownId = latestMedia?.maxId || 0;
        let oldestKnownId = oldestMedia?.minId || 0;

        let totalScanned = 0;
        let photosAdded = 0;
        let videosAdded = 0;

        const insertStmt = db.raw.prepare(`
          INSERT INTO media (
            telegram_message_id, channel_id, media_type, date, caption,
            file_name, mime_type, file_size, width, height, duration, message_link
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(channel_id, telegram_message_id) DO UPDATE SET
            caption = excluded.caption,
            file_name = excluded.file_name,
            mime_type = excluded.mime_type,
            file_size = excluded.file_size,
            duration = excluded.duration,
            width = excluded.width,
            height = excluded.height,
            message_link = excluded.message_link
        `);

        // Phase 1: Fetch newer messages if we already had a library
        if (maxKnownId > 0) {
          this.currentProgress.phase = `Checking for new messages (since ID ${maxKnownId})...`;
          this.emit('progress', this.currentProgress);

          let offsetId = 0;
          let hasMoreNew = true;

          while (hasMoreNew) {
            const messages = await client.getMessages(channelEntity, {
              limit: 100,
              offsetId: offsetId,
              minId: maxKnownId,
            });

            if (!messages || messages.length === 0) {
              break;
            }

            for (const msg of messages) {
              totalScanned++;
              this.currentProgress.messagesScanned = totalScanned;
              this.currentProgress.currentMessageId = msg.id;

              const meta = extractMediaMetadata(msg, activeChannel.id);
              if (meta) {
                insertStmt.run(
                  meta.telegram_message_id,
                  meta.channel_id,
                  meta.media_type,
                  meta.date,
                  meta.caption,
                  meta.file_name,
                  meta.mime_type,
                  meta.file_size,
                  meta.width,
                  meta.height,
                  meta.duration,
                  meta.message_link
                );

                if (meta.media_type === 'video') videosAdded++;
                if (meta.media_type === 'photo') photosAdded++;
                this.currentProgress.photosAdded = photosAdded;
                this.currentProgress.videosAdded = videosAdded;
              }
            }

            this.emit('progress', this.currentProgress);

            const lastMsg = messages[messages.length - 1];
            if (messages.length < 100 || lastMsg.id <= maxKnownId + 1) {
              hasMoreNew = false;
            } else {
              offsetId = lastMsg.id;
            }
          }
        }

        // Phase 2: Historical messages retrieval (backwards paging)
        this.currentProgress.phase = 'Retrieving historical media library...';
        this.emit('progress', this.currentProgress);

        let currentOffset = options.fullBackfill && oldestKnownId > 0 ? oldestKnownId : 0;
        let fetchMore = true;

        while (fetchMore) {
          console.log(`[Sync] Fetching batch for ${activeChannel.title} with offsetId: ${currentOffset}...`);
          const messages = await client.getMessages(channelEntity, {
            limit: 100,
            offsetId: currentOffset,
          });

          if (!messages || messages.length === 0) {
            console.log('[Sync] No more messages returned. Reached beginning of channel.');
            break;
          }

          for (const msg of messages) {
            totalScanned++;
            this.currentProgress.messagesScanned = totalScanned;
            this.currentProgress.currentMessageId = msg.id;

            const meta = extractMediaMetadata(msg, activeChannel.id);
            if (meta) {
              insertStmt.run(
                meta.telegram_message_id,
                meta.channel_id,
                meta.media_type,
                meta.date,
                meta.caption,
                meta.file_name,
                meta.mime_type,
                meta.file_size,
                meta.width,
                meta.height,
                meta.duration,
                meta.message_link
              );

              if (meta.media_type === 'video') videosAdded++;
              if (meta.media_type === 'photo') photosAdded++;
              this.currentProgress.photosAdded = photosAdded;
              this.currentProgress.videosAdded = videosAdded;
            }
          }

          this.emit('progress', this.currentProgress);

          const oldestInBatch = messages[messages.length - 1];
          if (messages.length < 100 || oldestInBatch.id <= 1) {
            fetchMore = false;
          } else {
            currentOffset = oldestInBatch.id;
          }

          await new Promise((r) => setTimeout(r, 200));
        }

        this.currentProgress.status = 'completed';
        this.currentProgress.phase = 'Sync completed successfully!';
        this.currentProgress.completedAt = Date.now();
        this.emit('progress', this.currentProgress);

        db.run(`
          UPDATE sync_history 
          SET completed_at = ?, status = 'completed', photos_added = ?, videos_added = ?, total_messages_scanned = ?
          WHERE id = ?
        `, [
          Math.floor(Date.now() / 1000),
          photosAdded,
          videosAdded,
          totalScanned,
          syncHistoryId
        ]);

        console.log(`[Sync] Finished for ${activeChannel.title}! Scanned ${totalScanned} messages. Found ${videosAdded} videos, ${photosAdded} photos.`);
      } catch (err) {
        console.error('[Sync] Error during sync:', err);
        this.currentProgress.status = 'error';
        this.currentProgress.phase = 'Sync failed';
        this.currentProgress.errorMessage = err.message;
        this.emit('progress', this.currentProgress);

        db.run(`
          UPDATE sync_history 
          SET completed_at = ?, status = 'failed', error_message = ?
          WHERE id = ?
        `, [
          Math.floor(Date.now() / 1000),
          err.message,
          syncHistoryId
        ]);
      } finally {
        this.isSyncing = false;
      }
    })();

    return { started: true, progress: this.currentProgress };
  }
}

const syncService = new SyncService();
module.exports = syncService;
