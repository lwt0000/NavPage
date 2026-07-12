# 控制中心 · Command Center

Personal navigation hub and self-updating service health dashboard. One page that is both the launcher for every personal service (Emby, MoviePilot, file transfer, VPN admin, …) and a live monitor of whether each of them is actually up, fast, and reachable.

Built with Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Framer Motion · Recharts · dnd-kit. UI copy is Simplified Chinese.

## Features

- **Live health monitoring** — server-side HTTP checks (no CORS issues, credentials never reach the browser) with per-service timeout, expected status codes, redirect and auth-mode handling. Statuses: 运行正常 / 性能下降 / 严重 / 离线 / 维护 / 需要登录.
- **Overview** — animated overall health gauge, avg latency with sparkline, uptime %, availability, active incidents, online/offline distribution bar, slowest/fastest/last-recovered highlights.
- **Service cards** — health score, latency, uptime, tags, favorite, admin badge; open service, run single check, edit, maintenance mode, delete.
- **Emby route comparison** — dedicated 海外线路 vs 中国线路 panel with recommended-route badge and latency trend chart per route.
- **Charts** — overall health history and per-route latency trends (chart/table toggle for accessibility).
- **Activity & incidents** — rolling event feed (recoveries, degradations, high latency, config changes) with active-incident callout.
- **Command palette** — `Ctrl K`: fuzzy search services by name/domain/category, run actions, see live status inline.
- **Edit mode** — drag-and-drop reordering (dnd-kit) persisted server-side.
- **Quick actions** — refresh all, full detection pass, open all favorites, export status report, and more.
- **Settings** — auto-refresh cadence (10s–15m or manual; slows automatically when the tab is hidden), status-change notifications, reduce-motion toggle.
- **Responsive & accessible** — mobile nav drawer + horizontal category chips, skip-to-content link, `aria` labels, focus-visible rings, status never conveyed by color alone, `prefers-reduced-motion` respected.

## Getting started

```bash
npm install
npm run dev    # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Requires Node 18.18+ (Node 20+ recommended). The server process must have outbound network access to the monitored services.

### Docker (fastest deploy)

```bash
# .env.local must exist with DASHBOARD_PASSWORD (see Security below)
docker compose up -d --build
```

Serves on port 3000. Health history and UI-added services persist in the `dashboard-data` volume; secrets are injected at runtime from `.env.local` (never baked into the image). Update with `git pull && docker compose up -d --build`.

## Security

Set `DASHBOARD_PASSWORD` (e.g. in `.env.local`) to enable the built-in login gate — session cookies (HMAC-signed, HttpOnly), per-IP rate limiting, and a logout in 设置 → 安全. Without it the dashboard and its API are open to anyone who can reach the server. Full hardening guide (HTTPS, VPN/Tailscale, Cloudflare Access, headers): see **[ADMIN-GUIDE.md](ADMIN-GUIDE.md)**.

## How it works

- **API routes** (`src/app/api/*`) own all state: `GET /api/health` returns the full snapshot (services, overall, incidents, activity, history); `POST /api/health/check` runs a full detection pass; CRUD + reorder under `/api/services`.
- **Checker** (`src/lib/server/checker.ts`) performs the actual HTTP probes and classifies results (latency thresholds, auth expectations, consecutive-failure tracking).
- **Store** (`src/lib/server/store.ts`) is a file-backed in-process singleton persisted to `data/store.json` (gitignored) — health history, user-added services, and activity survive restarts. Swap this module for a database without touching the API contracts.
- **Client** (`src/components/dashboard/DashboardProvider.tsx`) polls the snapshot on the configured cadence and exposes it via context; UI preferences live in `localStorage`.

## Configuration

- **Preconfigured services**: edit `src/lib/initial-services.ts` (used to seed the store on first run; after that, manage services in the UI — data lives in `data/store.json`).
- **UI text / locale**: `src/locales/zh-CN.ts`.
- **Theme tokens** (colors, fonts, status palette): `@theme` block in `src/app/globals.css`.
- To re-seed from scratch, stop the server and delete `data/store.json`.

## Project layout

```
src/
  app/               # App Router pages + API routes
  components/        # dashboard, services, health, activity, layout, palette, settings, ui
  lib/               # types, formatting, health math
  lib/server/        # store, checker, server messages
  locales/           # zh-CN strings
```
