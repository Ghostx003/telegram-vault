const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const db = require('../database/db');
const config = require('../config');

const HARDWIRED_API_ID = 27316185;
const HARDWIRED_API_HASH = '058d3bd0789eeecaf0dea102b6cc9886';

let client = null;
let currentSessionString = '';

async function getOrInitClient(forceNew = false) {
  if (client && !forceNew) {
    return client;
  }

  // Load session from DB or env
  const savedSession = db.getSetting('session_string', '') || process.env.TELEGRAM_SESSION || '';
  currentSessionString = savedSession;

  const session = new StringSession(savedSession);
  const apiId = config.telegram.apiId || HARDWIRED_API_ID;
  const apiHash = config.telegram.apiHash || db.getSetting('api_hash', HARDWIRED_API_HASH) || HARDWIRED_API_HASH;

  client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
    useWSS: false,
    autoReconnect: true,
  });

  return client;
}

async function connectClient() {
  const c = await getOrInitClient();
  if (!c.connected) {
    await c.connect();
  }
  return c;
}

async function isAuthorized() {
  try {
    const c = await connectClient();
    return await c.checkAuthorization();
  } catch (err) {
    console.error('Error checking authorization:', err.message);
    return false;
  }
}

async function saveSession() {
  if (!client) return;
  const sessionString = client.session.save();
  currentSessionString = sessionString;
  db.setSetting('session_string', sessionString);
  console.log('Telegram session saved securely to database.');
  return sessionString;
}

async function getMe() {
  try {
    const c = await connectClient();
    if (await c.checkAuthorization()) {
      return await c.getMe();
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function logout() {
  try {
    if (client) {
      if (client.connected) {
        // Disconnect
        await client.disconnect();
      }
    }
  } catch (err) {
    console.error('Error during logout:', err);
  } finally {
    db.deleteSetting('session_string');
    client = null;
    currentSessionString = '';
  }
}

module.exports = {
  getOrInitClient,
  connectClient,
  isAuthorized,
  saveSession,
  getMe,
  logout,
  HARDWIRED_API_ID,
  HARDWIRED_API_HASH
};
