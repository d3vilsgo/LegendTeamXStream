# LegendTeam IPTV Player

Premium IPTV web player with Xtream Codes support.

## What this is
A modern dark-themed IPTV web app that:
- Uses a **server-side proxy** for Xtream API calls
- Lists **Live TV / Movies / Series**
- Plays streams inside the app with a modal player
- Supports Favorites & History (if enabled in the project)

## Key goals (product-grade)
- No Xtream credentials exposed to the client
- Fast navigation (cache + request dedupe)
- Reliable playback (retry/fallback)
- Clean UI/UX (premium look and consistent components)

---

## Tech Stack
- Node.js + Express (server/proxy)
- TypeScript
- Vite (client)
- TailwindCSS

---

## Project Structure
- `client/`  → Web UI
- `server/`  → API proxy + streaming endpoints
- `shared/`  → Shared types/helpers

---

## Setup (Local)
### 1) Install
```bash
npm install
