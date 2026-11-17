const { Api } = require('telegram');
const clientModule = require('./client');
const db = require('../database/db');
const config = require('../config');

const HARDWIRED_API_ID = 27316185;
const HARDWIRED_API_HASH = '058d3bd0789eeecaf0dea102b6cc9886';

// Ensure hardwired credentials are also stored in DB
db.setSetting('api_id', HARDWIRED_API_ID);
db.setSetting('api_hash', HARDWIRED_API_HASH);

let pendingAuth = null; // { phoneNumber, phoneCodeHash, timestamp }

async function getAuthStatus() {
  const currentApiHash = HARDWIRED_API_HASH;
  const authorized = await clientModule.isAuthorized();
  let user = null;

  if (authorized) {
    try {
      const me = await clientModule.getMe();
      if (me) {
        user = {
          id: me.id ? me.id.toString() : null,
          firstName: me.firstName || '',
          lastName: me.lastName || '',
          username: me.username || '',
          phone: me.phone || ''
        };
      }
    } catch (e) {
      console.warn('Could not fetch user details:', e.message);
    }
  }

  return {
    authenticated: authorized,
    hasApiHash: true,
    hasSession: Boolean(db.getSetting('session_string', '')),
    user,
    pendingAuth: Boolean(pendingAuth && (Date.now() - pendingAuth.timestamp < 10 * 60 * 1000)),
  };
}

async function sendVerificationCode(phoneNumber, customApiHash = null) {
  const apiId = HARDWIRED_API_ID;
  const apiHash = HARDWIRED_API_HASH;

  const client = await clientModule.connectClient();
  const apiCredentials = {
    apiId,
    apiHash,
  };

  const cleanPhone = phoneNumber.replace(/\s+/g, '').trim();
  console.log(`[Telegram Auth] Sending verification code to ${cleanPhone} with API ID ${apiId}...`);
  const res = await client.sendCode(apiCredentials, cleanPhone);

  pendingAuth = {
    phoneNumber: cleanPhone,
    phoneCodeHash: res.phoneCodeHash,
    isCodeViaApp: res.isCodeViaApp,
    timestamp: Date.now(),
  };

  return {
    success: true,
    phoneNumber: cleanPhone,
    isCodeViaApp: res.isCodeViaApp,
    message: res.isCodeViaApp 
      ? 'Verification code sent to your Telegram app.' 
      : 'Verification code sent via SMS.'
  };
}

async function verifyCode(code) {
  if (!pendingAuth || !pendingAuth.phoneCodeHash) {
    throw new Error('No pending login request. Please request a verification code first.');
  }

  const cleanCode = code.toString().replace(/\s+/g, '').trim();
  const client = await clientModule.connectClient();

  try {
    const result = await client.invoke(new Api.auth.SignIn({
      phoneNumber: pendingAuth.phoneNumber,
      phoneCodeHash: pendingAuth.phoneCodeHash,
      phoneCode: cleanCode,
    }));

    await clientModule.saveSession();
    pendingAuth = null;

    const me = await clientModule.getMe();
    return {
      success: true,
      authenticated: true,
      user: {
        id: me?.id?.toString(),
        firstName: me?.firstName || '',
        lastName: me?.lastName || '',
        username: me?.username || '',
      }
    };
  } catch (err) {
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED' || err.message?.includes('SESSION_PASSWORD_NEEDED')) {
      return {
        success: false,
        requiresPassword: true,
        message: 'Two-step verification (2FA) is enabled on your account. Please enter your 2FA password.'
      };
    }
    throw err;
  }
}

async function verifyPassword(password) {
  if (!password) {
    throw new Error('Password cannot be empty.');
  }

  const client = await clientModule.connectClient();

  const apiCredentials = {
    apiId: HARDWIRED_API_ID,
    apiHash: HARDWIRED_API_HASH,
  };

  // GramJS signInWithPassword
  await client.signInWithPassword(apiCredentials, {
    password: async () => password,
    onError: (err) => {
      console.error('Password error callback:', err);
      return true; // Stop
    }
  });

  await clientModule.saveSession();
  pendingAuth = null;

  const me = await clientModule.getMe();
  return {
    success: true,
    authenticated: true,
    user: {
      id: me?.id?.toString(),
      firstName: me?.firstName || '',
      lastName: me?.lastName || '',
      username: me?.username || '',
    }
  };
}

async function logout() {
  pendingAuth = null;
  await clientModule.logout();
  return { success: true };
}

module.exports = {
  getAuthStatus,
  sendVerificationCode,
  verifyCode,
  verifyPassword,
  logout,
  HARDWIRED_API_ID,
  HARDWIRED_API_HASH
};
