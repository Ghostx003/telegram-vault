const fs = require('fs');
const path = require('path');
const bigInt = require('big-integer');
const { iterDownload } = require('telegram/client/downloads');
const config = require('../config');
const db = require('../database/db');
const clientModule = require('../telegram/client');
const { resolveChannelEntity } = require('../telegram/channel');

const activeDownloads = new Map(); // messageId -> { promise }

class CacheService {
  constructor() {
    this.thumbsDir = config.paths.thumbnails;
    this.photosDir = config.paths.photos;
    this.videosDir = config.paths.videos;
  }

  getThumbnailPath(messageId, channelId = null) {
    if (channelId) {
      const clean = String(channelId).replace(/^-100/, '').replace(/^-/, '');
      const scopedPath = path.join(this.thumbsDir, `${clean}_${messageId}.jpg`);
      if (fs.existsSync(scopedPath)) return scopedPath;
    }
    const standardPath = path.join(this.thumbsDir, `${messageId}.jpg`);
    if (fs.existsSync(standardPath)) return standardPath;
    if (channelId) {
      const clean = String(channelId).replace(/^-100/, '').replace(/^-/, '');
      return path.join(this.thumbsDir, `${clean}_${messageId}.jpg`);
    }
    return standardPath;
  }

  getPhotoPath(messageId, channelId = null) {
    if (channelId) {
      const clean = String(channelId).replace(/^-100/, '').replace(/^-/, '');
      const scopedPath = path.join(this.photosDir, `${clean}_${messageId}.jpg`);
      if (fs.existsSync(scopedPath)) return scopedPath;
    }
    const standardPath = path.join(this.photosDir, `${messageId}.jpg`);
    if (fs.existsSync(standardPath)) return standardPath;
    if (channelId) {
      const clean = String(channelId).replace(/^-100/, '').replace(/^-/, '');
      return path.join(this.photosDir, `${clean}_${messageId}.jpg`);
    }
    return standardPath;
  }

  getVideoPath(messageId, fileName = null, channelId = null) {
    const ext = fileName ? path.extname(fileName) || '.mp4' : '.mp4';
    if (channelId) {
      const clean = String(channelId).replace(/^-100/, '').replace(/^-/, '');
      const scopedPath = path.join(this.videosDir, `${clean}_${messageId}${ext}`);
      if (fs.existsSync(scopedPath)) return scopedPath;
    }
    const standardPath = path.join(this.videosDir, `${messageId}${ext}`);
    if (fs.existsSync(standardPath)) return standardPath;
    if (channelId) {
      const clean = String(channelId).replace(/^-100/, '').replace(/^-/, '');
      return path.join(this.videosDir, `${clean}_${messageId}${ext}`);
    }
    return standardPath;
  }

  isThumbnailCached(messageId, channelId = null) {
    const p = this.getThumbnailPath(messageId, channelId);
    return fs.existsSync(p) && fs.statSync(p).size > 0;
  }

  isPhotoCached(messageId, channelId = null) {
    const p = this.getPhotoPath(messageId, channelId);
    return fs.existsSync(p) && fs.statSync(p).size > 0;
  }

  isVideoCached(messageId, fileName = null, channelId = null) {
    const p = this.getVideoPath(messageId, fileName, channelId);
    return fs.existsSync(p) && fs.statSync(p).size > 0;
  }

  async getOrFetchThumbnail(messageId, channelId = null) {
    let effectiveChannelId = channelId;
    if (!effectiveChannelId) {
      const item = db.get('SELECT channel_id, thumbnail_path FROM media WHERE telegram_message_id = ? LIMIT 1', [messageId]);
      effectiveChannelId = item?.channel_id || null;
      if (item?.thumbnail_path && fs.existsSync(item.thumbnail_path)) {
        return item.thumbnail_path;
      }
    }

    const thumbPath = this.getThumbnailPath(messageId, effectiveChannelId);
    if (this.isThumbnailCached(messageId, effectiveChannelId)) {
      return thumbPath;
    }

    const downloadKey = `thumb_${effectiveChannelId || ''}_${messageId}`;
    if (activeDownloads.has(downloadKey)) {
      return await activeDownloads.get(downloadKey).promise;
    }

    const downloadPromise = (async () => {
      const client = await clientModule.connectClient();
      const channel = await resolveChannelEntity(client, effectiveChannelId ? { id: effectiveChannelId } : null);

      const messages = await client.getMessages(channel, { ids: [Number(messageId)] });
      if (!messages || messages.length === 0 || !messages[0]?.media) {
        throw new Error(`Message ${messageId} or media not found`);
      }

      const msg = messages[0];
      let buffer = null;

      try {
        buffer = await client.downloadMedia(msg.media, { thumb: 1 });
      } catch (err) {
        console.warn(`[Cache] thumb:1 failed for msg ${messageId}:`, err.message);
      }

      if (!buffer || buffer.length === 0) {
        try {
          buffer = await client.downloadMedia(msg.media, { thumb: 0 });
        } catch (err) {
          if (msg.media.photo) {
            buffer = await client.downloadMedia(msg.media);
          }
        }
      }

      if (buffer && buffer.length > 0) {
        fs.writeFileSync(thumbPath, buffer);
        if (effectiveChannelId) {
          db.run('UPDATE media SET thumbnail_path = ? WHERE telegram_message_id = ? AND channel_id = ?', [thumbPath, messageId, effectiveChannelId]);
        } else {
          db.run('UPDATE media SET thumbnail_path = ? WHERE telegram_message_id = ?', [thumbPath, messageId]);
        }
        return thumbPath;
      }

      throw new Error(`Could not generate thumbnail for message ${messageId}`);
    })();

    activeDownloads.set(downloadKey, { promise: downloadPromise });

    try {
      return await downloadPromise;
    } finally {
      activeDownloads.delete(downloadKey);
    }
  }

  async getOrFetchPhoto(messageId, channelId = null) {
    let effectiveChannelId = channelId;
    if (!effectiveChannelId) {
      const item = db.get('SELECT channel_id, local_cache_path FROM media WHERE telegram_message_id = ? LIMIT 1', [messageId]);
      effectiveChannelId = item?.channel_id || null;
      if (item?.local_cache_path && fs.existsSync(item.local_cache_path)) {
        return item.local_cache_path;
      }
    }

    const photoPath = this.getPhotoPath(messageId, effectiveChannelId);
    if (this.isPhotoCached(messageId, effectiveChannelId)) {
      return photoPath;
    }

    const downloadKey = `photo_${effectiveChannelId || ''}_${messageId}`;
    if (activeDownloads.has(downloadKey)) {
      return await activeDownloads.get(downloadKey).promise;
    }

    const downloadPromise = (async () => {
      const client = await clientModule.connectClient();
      const channel = await resolveChannelEntity(client, effectiveChannelId ? { id: effectiveChannelId } : null);

      const messages = await client.getMessages(channel, { ids: [Number(messageId)] });
      if (!messages || messages.length === 0 || !messages[0]?.media) {
        throw new Error(`Message ${messageId} or media not found`);
      }

      const msg = messages[0];
      const tempPath = `${photoPath}.tmp`;
      
      const buffer = await client.downloadMedia(msg.media);
      if (!buffer || buffer.length === 0) {
        throw new Error(`Failed to download photo for message ${messageId}`);
      }

      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, photoPath);

      if (effectiveChannelId) {
        db.run('UPDATE media SET local_cache_path = ? WHERE telegram_message_id = ? AND channel_id = ?', [photoPath, messageId, effectiveChannelId]);
      } else {
        db.run('UPDATE media SET local_cache_path = ? WHERE telegram_message_id = ?', [photoPath, messageId]);
      }

      const thumbPath = this.getThumbnailPath(messageId, effectiveChannelId);
      if (!fs.existsSync(thumbPath)) {
        fs.copyFileSync(photoPath, thumbPath);
        if (effectiveChannelId) {
          db.run('UPDATE media SET thumbnail_path = ? WHERE telegram_message_id = ? AND channel_id = ?', [thumbPath, messageId, effectiveChannelId]);
        } else {
          db.run('UPDATE media SET thumbnail_path = ? WHERE telegram_message_id = ?', [thumbPath, messageId]);
        }
      }

      return photoPath;
    })();

    activeDownloads.set(downloadKey, { promise: downloadPromise });

    try {
      return await downloadPromise;
    } finally {
      activeDownloads.delete(downloadKey);
    }
  }

  // Progressive Instant Video Streaming with HTTP 206 Range support
  async streamVideoProgressive(req, res, messageId, item) {
    const videoPath = this.getVideoPath(messageId, item.file_name);

    // Case 1: If full video file already exists on disk, stream from local disk instantly
    if (this.isVideoCached(messageId, item.file_name)) {
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      const contentType = item.mime_type || 'video/mp4';

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
          res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
          return res.end();
        }

        const chunkSize = (end - start) + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
        });

        const fileStream = fs.createReadStream(videoPath, { start, end });
        return fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        });
        return fs.createReadStream(videoPath).pipe(res);
      }
    }

    // Case 2: Video not cached on disk -> Progressive streaming directly from Telegram via iterDownload!
    console.log(`[Stream] Progressive streaming msg ${messageId} directly from Telegram (Channel: ${item?.channel_id || 'active'})...`);
    const client = await clientModule.connectClient();
    const channel = await resolveChannelEntity(client, item?.channel_id ? { id: item.channel_id } : null);

    const messages = await client.getMessages(channel, { ids: [Number(messageId)] });
    if (!messages || messages.length === 0 || !messages[0]?.media) {
      return res.status(404).json({ success: false, error: 'Telegram video not found' });
    }

    const msg = messages[0];
    const doc = msg.media.document || msg.document;
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document media missing' });
    }

    const fileSize = Number(doc.size);
    const range = req.headers.range;
    const contentType = item.mime_type || 'video/mp4';

    let start = 0;
    let end = fileSize - 1;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      start = parseInt(parts[0], 10);
      if (parts[1]) {
        end = parseInt(parts[1], 10);
      }
    }

    if (start >= fileSize) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }

    const totalToStream = (end - start) + 1;

    // Send HTTP 206 Partial Content immediately so the browser video player starts playing!
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': totalToStream,
      'Content-Type': contentType,
    });

    let clientAborted = false;
    req.on('close', () => {
      clientAborted = true;
    });

    // Request 512KB chunks for high-throughput streaming
    const CHUNK_SIZE = 512 * 1024;
    const iter = iterDownload(client, {
      file: msg.media,
      offset: bigInt(start),
      requestSize: CHUNK_SIZE,
      fileSize: bigInt(fileSize),
    });

    let bytesSent = 0;

    try {
      for await (const chunk of iter) {
        if (clientAborted) {
          break;
        }

        const remaining = totalToStream - bytesSent;
        if (remaining <= 0) {
          break;
        }

        const chunkToSend = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
        const canWriteMore = res.write(chunkToSend);
        bytesSent += chunkToSend.length;

        if (bytesSent >= totalToStream) {
          break;
        }

        // Handle backpressure if browser buffer is full
        if (!canWriteMore) {
          await new Promise((resolve) => res.once('drain', resolve));
        }
      }
    } catch (streamErr) {
      if (!clientAborted) {
        console.warn(`[Stream] Streaming aborted for msg ${messageId}:`, streamErr.message);
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  }

  // Delete physical video file when video player is closed
  deleteVideoCache(messageId) {
    try {
      const files = fs.readdirSync(this.videosDir);
      for (const f of files) {
        if (f.startsWith(`${messageId}.`)) {
          const fullPath = path.join(this.videosDir, f);
          fs.unlinkSync(fullPath);
          console.log(`[Cache] Deleted physical video cache: ${fullPath}`);
        }
      }
      db.run('UPDATE media SET local_cache_path = NULL WHERE telegram_message_id = ?', [messageId]);
      return { success: true };
    } catch (err) {
      console.warn(`[Cache] Could not delete video cache for msg ${messageId}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // Clear all cache files (videos, photos, thumbnails)
  clearAllCache(category = 'all') {
    let totalFreed = 0;
    let filesDeleted = 0;

    const dirsToClear = [];
    if (category === 'all' || category === 'videos') dirsToClear.push(this.videosDir);
    if (category === 'all' || category === 'photos') dirsToClear.push(this.photosDir);
    if (category === 'all' || category === 'thumbnails') dirsToClear.push(this.thumbsDir);

    for (const dir of dirsToClear) {
      try {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            const p = path.join(dir, f);
            const stat = fs.statSync(p);
            if (stat.isFile()) {
              totalFreed += stat.size;
              fs.unlinkSync(p);
              filesDeleted++;
            }
          }
        }
      } catch (err) {
        console.warn(`[Cache] Error clearing dir ${dir}:`, err.message);
      }
    }

    if (category === 'all') {
      db.run('UPDATE media SET thumbnail_path = NULL, local_cache_path = NULL');
    } else if (category === 'videos') {
      db.run("UPDATE media SET local_cache_path = NULL WHERE media_type = 'video'");
    } else if (category === 'photos') {
      db.run("UPDATE media SET local_cache_path = NULL WHERE media_type = 'photo'");
    } else if (category === 'thumbnails') {
      db.run('UPDATE media SET thumbnail_path = NULL');
    }

    console.log(`[Cache] Cleared ${category} cache: ${filesDeleted} files, ${totalFreed} bytes freed.`);
    return {
      success: true,
      filesDeleted,
      freedBytes: totalFreed,
    };
  }
}

const cacheService = new CacheService();
module.exports = cacheService;
