const { Api } = require('telegram');
const config = require('../config');
const db = require('../database/db');

// Multi-channel entity cache (Map of channelId -> entity)
const channelCache = new Map();

function extractInviteHash(linkOrHash) {
  if (!linkOrHash) return null;
  const str = String(linkOrHash).trim();
  const match = str.match(/(?:joinchat\/|\+)([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // If user pasted bare invite hash
  if (/^[a-zA-Z0-9_-]{10,}$/.test(str) && !str.startsWith('-100')) {
    return str;
  }
  return null;
}

function extractUsername(linkOrUsername) {
  if (!linkOrUsername) return null;
  const str = String(linkOrUsername).trim();
  if (str.includes('+') || str.includes('joinchat/')) return null;
  const match = str.match(/(?:t\.me\/|@)?([a-zA-Z0-9_]{4,})/);
  if (match) return match[1];
  return null;
}

function normalizeChannelId(entityOrId) {
  let idStr = '';
  if (typeof entityOrId === 'object' && entityOrId !== null) {
    idStr = entityOrId.id ? entityOrId.id.toString() : '';
  } else {
    idStr = String(entityOrId || '').trim();
  }
  if (!idStr) return '';
  idStr = idStr.replace(/^-100/, '').replace(/^-/, '');
  return `-100${idStr}`;
}

async function resolveChannelEntity(client, targetChannel = null) {
  const isExplicitTarget = Boolean(targetChannel);
  const activeChannel = targetChannel || db.getActiveChannel();

  // CRITICAL: When targetChannel is provided, DO NOT fall back to default config channelId or inviteLink!
  let rawChannelId = activeChannel?.id ? String(activeChannel.id).trim() : (isExplicitTarget ? '' : config.telegram.channelId);
  let inviteLink = activeChannel?.invite_link ? String(activeChannel.invite_link).trim() : (isExplicitTarget ? '' : config.telegram.inviteLink);

  const normId = rawChannelId ? normalizeChannelId(rawChannelId) : '';
  const inviteHash = extractInviteHash(inviteLink);
  const username = extractUsername(inviteLink || rawChannelId);

  // Check cache if we already resolved this channel ID
  if (normId && channelCache.has(normId)) {
    return channelCache.get(normId);
  }

  console.log(`[Channel] Resolving channel. Target ID: "${rawChannelId}", Title: "${activeChannel?.title || ''}", Invite: "${inviteLink}"`);

  // Strategy 1: If invite hash is provided (e.g. private channel invite link https://t.me/+...), check/join invite
  if (inviteHash) {
    try {
      console.log(`[Channel] Checking chat invite with hash: ${inviteHash}`);
      const checkResult = await client.invoke(new Api.messages.CheckChatInvite({
        hash: inviteHash
      }));

      if (checkResult instanceof Api.ChatInviteAlready) {
        console.log(`[Channel] User is already a participant: ${checkResult.chat?.title} (ID: ${checkResult.chat?.id})`);
        const entity = checkResult.chat;
        const resolvedNormId = normalizeChannelId(entity);
        channelCache.set(resolvedNormId, entity);
        if (normId) channelCache.set(normId, entity);
        return entity;
      }

      console.log('[Channel] Joining channel via invite hash...');
      const importResult = await client.invoke(new Api.messages.ImportChatInvite({
        hash: inviteHash
      }));

      if (importResult.chats && importResult.chats.length > 0) {
        const entity = importResult.chats[0];
        console.log(`[Channel] Successfully joined channel: ${entity.title}`);
        const resolvedNormId = normalizeChannelId(entity);
        channelCache.set(resolvedNormId, entity);
        if (normId) channelCache.set(normId, entity);
        return entity;
      }
    } catch (inviteErr) {
      console.warn('[Channel] Invite link check/import returned:', inviteErr.errorMessage || inviteErr.message);
      if (inviteErr.errorMessage === 'USER_ALREADY_PARTICIPANT') {
        console.log('[Channel] Already participant, searching dialogs for match...');
        try {
          const dialogs = await client.getDialogs({ limit: 100 });
          // If title was specified, match by title
          if (activeChannel?.title) {
            for (const dialog of dialogs) {
              if (dialog.title && dialog.title.trim().toLowerCase() === activeChannel.title.trim().toLowerCase()) {
                const resolvedNormId = normalizeChannelId(dialog.entity);
                channelCache.set(resolvedNormId, dialog.entity);
                return dialog.entity;
              }
            }
          }
        } catch (dErr) {}
      }
    }
  }

  // Strategy 2: If we have an ID (e.g. -100...), check dialogs first
  if (normId) {
    const cleanId = normId.replace(/^-100/, '').replace(/^-/, '');

    try {
      const dialogs = await client.getDialogs({ limit: 100 });
      for (const dialog of dialogs) {
        const dId = dialog.id ? dialog.id.toString() : '';
        const dNorm = normalizeChannelId(dId);
        const dClean = dId.replace(/^-100/, '').replace(/^-/, '');

        if (dNorm === normId || dClean === cleanId || dId === rawChannelId) {
          console.log(`[Channel] Found channel in user dialogs: ${dialog.title} (ID: ${dialog.id})`);
          channelCache.set(normId, dialog.entity);
          channelCache.set(dNorm, dialog.entity);
          return dialog.entity;
        }
      }
    } catch (err) {
      console.warn('[Channel] Could not fetch dialogs:', err.message);
    }

    // Direct getEntity with candidate ID types
    const candidates = [
      normId,
      rawChannelId,
      cleanId,
      parseInt(cleanId, 10),
      BigInt(cleanId),
    ];

    for (const candidate of candidates) {
      try {
        const entity = await client.getEntity(candidate);
        if (entity) {
          console.log(`[Channel] Successfully resolved entity with candidate: ${candidate}`);
          channelCache.set(normId, entity);
          channelCache.set(normalizeChannelId(entity), entity);
          return entity;
        }
      } catch (err) {
        // Continue to next candidate
      }
    }
  }

  // Strategy 3: Username lookup (for public channels like @channelname or https://t.me/channelname)
  if (username && !username.startsWith('+')) {
    try {
      console.log(`[Channel] Looking up public channel by username: @${username}`);
      const entity = await client.getEntity(username);
      if (entity) {
        console.log(`[Channel] Resolved public channel: ${entity.title}`);
        const resolvedNormId = normalizeChannelId(entity);
        channelCache.set(resolvedNormId, entity);
        if (normId) channelCache.set(normId, entity);
        return entity;
      }
    } catch (err) {
      console.warn(`[Channel] getEntity by username "${username}" failed:`, err.message);
    }
  }

  // Strategy 4: Fallback to getEntity by raw invite link
  if (inviteLink) {
    try {
      const entity = await client.getEntity(inviteLink);
      if (entity) {
        const resolvedNormId = normalizeChannelId(entity);
        channelCache.set(resolvedNormId, entity);
        if (normId) channelCache.set(normId, entity);
        return entity;
      }
    } catch (err) {
      // Continue
    }
  }

  throw new Error(`Could not access channel with ID "${rawChannelId || '(none)'}" or invite "${inviteLink || '(none)'}". Make sure your Telegram account has joined or has access to this channel.`);
}

function clearCachedChannel(channelId = null) {
  if (channelId) {
    channelCache.delete(channelId);
    channelCache.delete(normalizeChannelId(channelId));
  } else {
    channelCache.clear();
  }
}

module.exports = {
  resolveChannelEntity,
  clearCachedChannel,
  extractInviteHash,
  extractUsername,
  normalizeChannelId
};
