const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Check root .env first, then backend .env
const rootEnvPath = path.join(__dirname, '..', '.env');
const backendEnvPath = path.join(__dirname, '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

const BASE_DIR = path.resolve(__dirname);
const DATA_DIR = path.join(BASE_DIR, 'data');
const CACHE_DIR = path.join(BASE_DIR, 'cache');
const PHOTOS_CACHE_DIR = path.join(CACHE_DIR, 'photos');
const VIDEOS_CACHE_DIR = path.join(CACHE_DIR, 'videos');
const THUMBS_CACHE_DIR = path.join(CACHE_DIR, 'thumbnails');

[DATA_DIR, CACHE_DIR, PHOTOS_CACHE_DIR, VIDEOS_CACHE_DIR, THUMBS_CACHE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Hardwired API ID & API Hash as requested
const HARDWIRED_API_ID = 27316185;
const HARDWIRED_API_HASH = '058d3bd0789eeecaf0dea102b6cc9886';

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  telegram: {
    apiId: parseInt(process.env.TELEGRAM_API_ID, 10) || HARDWIRED_API_ID,
    apiHash: process.env.TELEGRAM_API_HASH || HARDWIRED_API_HASH,
    channelId: process.env.TELEGRAM_CHANNEL_ID || '-1001269413427',
    inviteLink: process.env.TELEGRAM_CHANNEL_INVITE_LINK || 'https://t.me/+czbDHGQCY1k1YzY1',
  },
  paths: {
    base: BASE_DIR,
    data: DATA_DIR,
    cache: CACHE_DIR,
    photos: PHOTOS_CACHE_DIR,
    videos: VIDEOS_CACHE_DIR,
    thumbnails: THUMBS_CACHE_DIR,
  }
};

module.exports = config;
