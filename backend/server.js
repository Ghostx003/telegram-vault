const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const config = require('./config');
const clientModule = require('./telegram/client');

// Global process error handlers to prevent crashes on socket drops or aborted client requests
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

// Import routes
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const channelsRoutes = require('./routes/channels');
const videosRoutes = require('./routes/videos');
const photosRoutes = require('./routes/photos');
const mediaRoutes = require('./routes/media');
const statsRoutes = require('./routes/stats');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build if present
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Fallback for SPA routing in Express 5
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('Personal Telegram Media Viewer API is running. Start the frontend dev server or run npm run build in frontend.');
});

// Helper to discover local LAN IP
function getLocalLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (!net.address.startsWith('169.254.') && !net.address.startsWith('100.')) {
          return net.address;
        }
      }
    }
  }
  return '127.0.0.1';
}

// Helper to discover Tailscale IP
function getTailscaleIp() {
  try {
    const out = execSync('tailscale ip -4', { encoding: 'utf8', timeout: 1500 });
    return out.trim();
  } catch (e) {
    // Check network interfaces for 100.x.x.x
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && net.address.startsWith('100.')) {
          return net.address;
        }
      }
    }
    return null;
  }
}

let server = null;
if (require.main === module) {
  server = app.listen(config.port, '0.0.0.0', async () => {
    const lanIp = getLocalLanIp();
    const tailscaleIp = getTailscaleIp();

    console.log(`\n=============================================================`);
    console.log(` 🚀  TELEGRAM MEDIA VAULT - STREAMING SERVER`);
    console.log(`=============================================================`);
    console.log(` 💻 Localhost:    http://localhost:${config.port}`);
    console.log(` 📶 Same Wi-Fi:   http://${lanIp}:${config.port} (Open on Phone/Tablet)`);
    if (tailscaleIp) {
      console.log(` 🌐 Tailscale:    http://${tailscaleIp}:${config.port} (Access Anywhere on Phone)`);
    } else {
      console.log(` 🌐 Tailscale:    Not detected (Run Tailscale for remote access)`);
    }
    console.log(` 📡 Channel ID:   ${config.telegram.channelId}`);
    console.log(`=============================================================\n`);

    // Attempt background connection if session already saved
    try {
      const isAuth = await clientModule.isAuthorized();
      if (isAuth) {
        const me = await clientModule.getMe();
        console.log(`[Telegram] Authenticated as ${me?.firstName || 'User'} (@${me?.username || 'no-username'})`);
      } else {
        console.log('[Telegram] No authenticated session found. Login required via web UI or API.');
      }
    } catch (err) {
      console.warn('[Telegram] Startup check note:', err.message);
    }
  });
}

module.exports = { app, server };
