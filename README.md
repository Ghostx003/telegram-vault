# 🚀 Telegram Media Vault (`telegram-vault`)

> **High-Performance Personal Telegram Media Streaming Vault & Discovery Engine**  
> Stream high-definition videos and uncropped full photographs seamlessly across **PC, Phone, and Tablet** via local **Wi-Fi** or **Tailscale** with native **Netflix-style mobile touch gestures** and **zero phone login required**.

---

## 📱 Mobile & Netflix-Style Touch Gestures

Designed from the ground up for smartphones and notched displays (`viewport-fit=cover`):

| Gesture | Action | Description |
| :--- | :--- | :--- |
| **⚡ Tap & Hold** | **2X Playback Speed** | Press and hold anywhere on the video to boost playback to 2X. Release to immediately resume normal speed. |
| **📱 Double-Tap** | **Fullscreen & Landscape** | Instantly launches into edge-to-edge landscape fullscreen, expanding to **cover the notch cutout**. |
| **⏩ Swipe Left / Right** | **Netflix-Style Scrub & Seek** | Drag left or right across the screen to quickly scrub forward (`+15s`) or backward (`-10s`) with live HUD timestamps. |
| **🎲 Swipe Up / Down** | **New Random Video** | Swipe up or down across the video to jump into a brand new surprise video. |
| **🖱️ Mouse Wheel Scroll** | **Switch Media** | Scroll up or down on any photo or video to flip to the next or previous item. |

---

## 🌐 Instant Cross-Device Access (Zero Phone Login)

Your Telegram session is authenticated and stored securely on your host PC in an encrypted SQLite database. **Your phone never needs to log into Telegram or enter verification codes!**

```
               ┌───────────────────────────────┐
               │    HOST PC (Backend Server)   │
               │   • GramJS MTProto Client     │
               │   • SQLite Vault Database     │
               │   • HTTP 206 Partial Streaming│
               └──────────────┬────────────────┘
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
   📶 Same Wi-Fi Network            🌐 Tailscale Private Mesh
 (Phone, Tablet, Smart TV)           (Cellular 4G/5G / Remote)
   http://192.168.x.x:5000            http://100.x.y.z:5000
   [ Instant Playback ]              [ Instant Playback ]
```

- **Local PC**: `http://localhost:5000`
- **Wi-Fi / LAN**: `http://192.168.29.189:5000` (Open on your iPhone, Android, iPad on the same home network)
- **Tailscale**: `http://100.83.20.17:5000` (Access securely anywhere in the world on mobile data)

---

## ⚡ 1-Click Launchers (`telegram.bat`)

The vault includes automated port-finding batch runners:

1. **Desktop Shortcut**: Double-click `telegram.bat` directly on your Windows Desktop!
2. **Project Directory**: Run `telegram.bat` from `e:\projects\REACTING TELEGRAM`.

Both scripts:
- Automatically scan and assign an available port (handling port conflicts seamlessly).
- Detect your LAN Wi-Fi IP and Tailscale IP.
- Display a quick-start connection dashboard on the screen.
- Auto-open your local browser.

---

## ✨ Features Overview

### 1. Unified Media Toggle & "Surprise Me" Engine
- **Sleek Segmented Toggle**: Switch between `[ 🎬 Videos ]` and `[ 📸 Photos ]` with one tap.
- **Dynamic "Surprise Me" Button**: Launches genuine random discoveries tailored to your active mode:
  - In **Photos Mode**: Opens a random photograph in the lightbox with continuous random next cycling.
  - In **Videos Mode**: Streams a random video with session repetition tracking.

### 2. 4-Photo Large Showcase Grid
- High-resolution, expansive 4-column layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`).
- **Full Uncropped Display**: Utilizes `aspect-[4/5]` with `object-contain` and an ambient blurred glow backdrop matching each photo's colors. 100% of the photograph is visible without clipping.

### 3. Continuous Random Cycling
- When opening a photo via **Surprise Me** / **Random Photo**, clicking **Next** (`ChevronRight`), pressing `Right Arrow` / `N` / `Space`, or scrolling down automatically draws a **new random photo** from the pool.
- Built-in session history stack lets you press **Previous** to go back to previously viewed random photos.

### 4. Multi-Channel Switching
- Connect multiple private and public channels via invite links (`https://t.me/+...`) or channel IDs (`-100...`).
- Switch active channel libraries on the fly without re-authenticating or re-syncing.

### 5. HTTP 206 Partial Streaming Engine
- Fast seeking, scrubbing, and instant video starts using partial content chunks.
- Smart on-disk cache management with 1-click cleanup options.

---

## ⌨️ Desktop Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` / `K` | Play / Pause |
| `Left` / `Right` | Seek -5s / +5s (Hold `Shift` for -15s / +15s) |
| `Up` / `Down` | Volume +10% / -10% |
| `M` | Mute / Unmute |
| `F` | Fullscreen Landscape (covers notch) |
| `N` | Next Random Video / Photo |
| `P` | Previous Media in Session History |
| `Esc` | Close Viewer |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 5, GramJS (Telegram MTProto Client), SQLite (`better-sqlite3`)
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide Icons
- **Networking**: Dual-stack HTTP server (0.0.0.0), Tailscale Mesh VPN, Wi-Fi LAN

---

## 📜 License

MIT License. Designed for personal Telegram media streaming and exploration.
