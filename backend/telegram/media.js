const { Api } = require('telegram');
const config = require('../config');

function extractMediaMetadata(message, channelId = null) {
  if (!message || !message.media) {
    return null;
  }

  const rawChannelId = channelId || config.telegram.channelId;
  const cleanChannelId = String(rawChannelId).replace('-100', '').replace('-', '');
  const messageLink = `https://t.me/c/${cleanChannelId}/${message.id}`;
  const caption = message.message || '';
  const date = message.date || Math.floor(Date.now() / 1000);

  // 1. Check for Photo
  if (message.media instanceof Api.MessageMediaPhoto || message.photo) {
    const photo = message.media.photo || message.photo;
    if (!photo) return null;

    let width = 0;
    let height = 0;
    let fileSize = 0;

    if (photo.sizes && Array.isArray(photo.sizes)) {
      // Find largest size
      for (const size of photo.sizes) {
        if (size.w && size.w > width) {
          width = size.w;
          height = size.h;
        }
        if (size.size && size.size > fileSize) {
          fileSize = size.size;
        }
      }
    }

    return {
      telegram_message_id: message.id,
      channel_id: rawChannelId,
      media_type: 'photo',
      date: date,
      caption: caption,
      file_name: `photo_${message.id}.jpg`,
      mime_type: 'image/jpeg',
      file_size: fileSize,
      width: width,
      height: height,
      duration: 0,
      message_link: messageLink,
    };
  }

  // 2. Check for Video Document
  if (message.media instanceof Api.MessageMediaDocument || message.document) {
    const doc = message.media.document || message.document;
    if (!doc) return null;

    const mime = doc.mimeType || '';
    const isVideoMime = mime.startsWith('video/');
    
    let isVideoAttr = false;
    let duration = 0;
    let width = 0;
    let height = 0;
    let fileName = `video_${message.id}.mp4`;

    if (doc.attributes && Array.isArray(doc.attributes)) {
      for (const attr of doc.attributes) {
        if (attr instanceof Api.DocumentAttributeVideo) {
          isVideoAttr = true;
          duration = attr.duration || 0;
          width = attr.w || 0;
          height = attr.h || 0;
        } else if (attr instanceof Api.DocumentAttributeFilename) {
          fileName = attr.fileName || fileName;
        } else if (attr instanceof Api.DocumentAttributeAudio && !attr.voice) {
          // It is an audio file, not video -> exclude
          return null;
        } else if (attr instanceof Api.DocumentAttributeSticker) {
          // Sticker -> exclude
          return null;
        }
      }
    }

    // Only accept if it is a video (either by mime or by video attribute)
    if (!isVideoMime && !isVideoAttr) {
      return null;
    }

    return {
      telegram_message_id: message.id,
      channel_id: rawChannelId,
      media_type: 'video',
      date: date,
      caption: caption,
      file_name: fileName,
      mime_type: mime || 'video/mp4',
      file_size: doc.size ? Number(doc.size) : 0,
      width: width,
      height: height,
      duration: duration,
      message_link: messageLink,
    };
  }

  // Text-only, poll, contact, unsupported document, etc.
  return null;
}

module.exports = {
  extractMediaMetadata
};
