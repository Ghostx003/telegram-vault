const net = require('net');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

// 1. Find an available port starting from 5000
function findAvailablePort(startPort = 5000) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '0.0.0.0', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// 2. Discover LAN IP (Wi-Fi or Ethernet)
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

// 3. Discover Tailscale IP
function getTailscaleIp() {
  try {
    const out = execSync('tailscale ip -4', { encoding: 'utf8', timeout: 1500 });
    return out.trim();
  } catch (e) {
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

// 4. Create Desktop Shortcut bat
function setupDesktopShortcut() {
  try {
    const desktopPath = path.join(os.homedir(), 'Desktop', 'telegram.bat');
    const projectDir = path.resolve(__dirname);
    const batContent = `@echo off
setlocal
title Telegram Media Vault
cd /d "${projectDir}"
node launcher.js
if %errorlevel% neq 0 (
  echo.
  echo Server exited with code %errorlevel%.
  pause
)
`;
    fs.writeFileSync(desktopPath, batContent, 'utf8');
    console.log(`[Setup] Desktop shortcut placed at: ${desktopPath}`);
  } catch (err) {
    console.warn('[Setup] Note: could not write to Desktop shortcut:', err.message);
  }
}

async function main() {
  console.clear();
  console.log('Detecting network interfaces and available ports...');

  // Setup desktop shortcut
  setupDesktopShortcut();

  const port = await findAvailablePort(5000);
  const lanIp = getLocalLanIp();
  const tailscaleIp = getTailscaleIp();

  const localUrl = `http://localhost:${port}`;
  const wifiUrl = `http://${lanIp}:${port}`;
  const tailscaleUrl = tailscaleIp ? `http://${tailscaleIp}:${port}` : null;

  console.log(`
======================================================================
  🚀  TELEGRAM MEDIA VAULT - STREAMING SERVER
======================================================================

  💻 LOCAL ACCESS (This PC):
     👉 ${localUrl}

  📶 WIFI / SAME NETWORK (Phone, Tablet, TV on same Wi-Fi):
     👉 ${wifiUrl}
     (No login required on phone! Works directly)

  🌐 TAILSCALE ACCESS (Anywhere in the world via 4G/5G/Remote):
     👉 ${tailscaleUrl || 'Tailscale not active (run tailscale to connect)'}

  💡 PORT ASSIGNED: ${port} (Available port selected automatically)

----------------------------------------------------------------------
  📱 TOUCH & DESKTOP CONTROLS:
     • Click on Video      : Instant Play / Pause (Resume)
     • Speed Button (1x)   : Instant Cycle (1x → 1.25x → 1.5x → 1.75x → 2x)
     • Double-Click / Tap  : Fullscreen & Landscape (Covers Notch)
     • Swipe Left / Right  : Fast Scrub & Seek Forward / Backward
     • Swipe Up / Down     : Switch to a Brand New Random Video
     • Mouse Wheel Scroll  : Instant Photo / Video Switching
======================================================================
Starting server...
`);

  // Ensure frontend build is ready
  const distPath = path.join(__dirname, 'frontend', 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('[Build] Building frontend for production...');
    execSync('npm run build --prefix frontend', { stdio: 'inherit' });
  }

  // Set environment port for backend
  process.env.PORT = String(port);

  // Require backend server directly in this process
  require('./backend/server');

  // Open browser locally after 1.5s
  setTimeout(() => {
    try {
      const startCmd = process.platform === 'win32' ? `start "" "${localUrl}"` : `open "${localUrl}"`;
      execSync(startCmd);
    } catch (e) {}
  }, 1500);
}

main().catch(err => {
  console.error('Fatal launcher error:', err);
  process.exit(1);
});
