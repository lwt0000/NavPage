# Admin Guide · 文韬控制中心

How to personalize the dashboard, lock it down, and manage services.

---

## 1. Change the admin name (and other identity text)

All user-facing text lives in **`src/locales/zh-CN.ts`**. The identity block is at the top:

```ts
app: {
  title: "控制中心",        // site name — header logo, browser tab title
  subtitle: "个人服务导航与运行状态中心",  // tagline — header + tab description
  user: "文韬",                 // ← admin display name (top-right of header)
  userRole: "管理员",           // ← role label under the name
  ...
}
```

- `app.user` → the name shown top-right; its **first character** is also used as the avatar letter.
- `app.userRole` → the small label beneath it.
- `app.title` / `app.subtitle` → also feed the browser tab `<title>`/description via `src/app/layout.tsx` (no need to edit that file).

After editing, restart the dev server (`npm run dev`) or rebuild (`npm run build && npm start`).

---

## 2. Security — locking the dashboard down

Without protection, **anyone who can reach the server can view your services and use the API to add/edit/delete them**. Protect it in layers; each layer below adds real security. For the highest standard, use **Layer 1 + Layer 2 + Layer 3** together.

### Layer 1 (built-in, do this first): password protection

The app ships with a session-based login gate. It activates automatically when you set an environment variable:

| Variable | Required | Meaning |
|---|---|---|
| `DASHBOARD_PASSWORD` | yes (to enable auth) | The access password. Use a long random one (20+ chars), e.g. from a password manager. |
| `AUTH_SECRET` | recommended | Random string used to sign session cookies. If unset, it is derived from the password. Rotating either logs every device out. |
| `AUTH_SESSION_HOURS` | optional | Session lifetime in hours. Default `168` (7 days). Use `24` for stricter setups. |

**How to set it** — create a file named `.env.local` in the project root (it is gitignored, never commit it):

```env
DASHBOARD_PASSWORD=use-a-long-random-password-here
AUTH_SECRET=another-long-random-string
AUTH_SESSION_HOURS=168
```

Then restart the server. What you get:

- Every page redirects to a login screen; every API call returns 401 until signed in.
- Sessions are HttpOnly, SameSite cookies signed with HMAC-SHA256 — no tokens readable by page scripts.
- Login is rate-limited: **5 wrong attempts per IP → locked for 15 minutes**.
- Password comparison is constant-time (no timing attacks).
- 退出登录 (logout) button lives in 设置 → 安全. The same panel shows a warning if you forgot to set the password.

> Generate strong values, e.g. in PowerShell:
> `-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})`
> or on Linux/macOS: `openssl rand -base64 32`

### Deploying with Docker (recommended)

With `.env.local` in place, the whole stack deploys in one command:

```bash
docker compose up -d --build      # build + start, serves on :3000
docker compose logs -f dashboard  # watch logs
docker compose down               # stop (data volume is kept)
```

What the setup gives you:

- **Multi-stage image** (Node 22 alpine, Next.js standalone output) running as a non-root user.
- **Secrets stay out of the image** — `.env.local` is docker-ignored and injected only at runtime via `env_file`; rebuilds never bake the password in.
- **Persistent data** — `data/store.json` lives in the named volume `dashboard-data`, so history and UI-added services survive restarts, rebuilds, and image upgrades. (`docker compose down -v` is the only thing that erases it.)
- **Container healthcheck** against the public `/api/auth/status` endpoint — `docker ps` shows `healthy`/`unhealthy`, and orchestrators can auto-restart on failure.
- To change the host port, edit `ports:` in `docker-compose.yml` (e.g. `"8080:3000"`).

### Layer 2 (required if reachable from outside): HTTPS

Never send the password over plain HTTP across a network you don't own. Put a reverse proxy with automatic TLS in front. Simplest is **Caddy** (2 lines):

```caddyfile
dash.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Caddy fetches and renews certificates automatically. (Nginx + certbot or Traefik work equally well.) The app already sends `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and a minimal `Permissions-Policy` on every response.

### Layer 3 (highest standard): don't expose it to the internet at all

A personal dashboard has exactly one user — you. The strongest posture is that the public internet can't even open a TCP connection to it:

- **Best: private overlay network.** Install [Tailscale](https://tailscale.com) (WireGuard-based, free for personal use) on the server and your devices. Bind the app to the tailnet IP or just firewall the port so only the tailnet reaches it. No open ports, no certificates to manage, MagicDNS gives you a nice URL. `tailscale serve` can even add HTTPS for you.
- **Equivalent: plain WireGuard/VPN** to your home network — you already run VPN infrastructure (routerman), so routing the dashboard through it costs nothing.
- **If it must be on the public internet:** put **Cloudflare Access (Zero Trust)** in front — free for personal use, enforces its own login (passkeys / OTP / SSO + device rules) *before* traffic ever reaches your server, hides your origin IP, and gives you audit logs. Your built-in password then acts as the second, independent layer.
- **Maximum paranoia:** mutual TLS (client certificates) at the reverse proxy — only devices holding your cert can connect. Powerful but fiddly on mobile.

### Additional hardening checklist

- ✅ Firewall the app port (3000) so only the reverse proxy / tailnet can reach it — never port-forward 3000 directly on your router.
- ✅ Run the Node process as a non-privileged user (or in a container).
- ✅ Keep dependencies updated: `npm audit` / `npm update` periodically.
- ✅ Rotate `DASHBOARD_PASSWORD` if a device is lost — this invalidates all sessions instantly.
- ✅ `data/store.json` contains your service URLs — keep server disk access restricted; it's already gitignored.
- ℹ️ Health-check URLs are fetched **by the server** (SSRF surface). With the password gate on, only you can add URLs, which closes the practical risk — still, avoid adding health-check URLs pointing at things like cloud metadata endpoints.

---

## 3. Change site metadata

| What | Where |
|---|---|
| Site name / tab title | `app.title` in `src/locales/zh-CN.ts` |
| Description / tagline | `app.subtitle` in `src/locales/zh-CN.ts` |
| Admin name / role | `app.user`, `app.userRole` (same file) |
| Browser theme color | `viewport.themeColor` in `src/app/layout.tsx` (default `#06080f`) |
| Colors, fonts, status palette | `@theme` block in `src/app/globals.css` |
| Favicon | drop `favicon.ico` (or `icon.png`) into `src/app/` — Next.js picks it up automatically |
| All other UI text | the rest of `src/locales/zh-CN.ts` — components never hardcode strings |

---

## 4. Add / manage services

### The easy way — in the UI (recommended)

Click **添加服务** (grid header or 快速操作 rail), or press `Ctrl K` and run the action. Fields:

| Field | Meaning |
|---|---|
| 服务名称 / 服务描述 | Display name and card description |
| 显示地址 | Short domain shown on the card (e.g. `emby.wentao.cloud`) |
| 跳转地址 | Full URL opened when you click 打开服务 |
| 健康检查地址 | URL the **server** probes; can differ from the navigation URL (e.g. probe a public status page of an admin backend) |
| 分类 / 标签 / 优先级 / 图标 | Organization and display |
| 预期 HTTP 状态码 | Comma-separated codes counted as healthy (default `200`) |
| 登录行为 | 预期需要登录 → 401/403 responses count as *online, auth required* instead of failures |
| 检测间隔 / 超时时间 | Per-service probe cadence and timeout |
| 加入收藏 / 管理后台 / 启用监控 | Favorite star, admin badge, monitoring on/off |

Everything you add is saved server-side to **`data/store.json`** and survives restarts. Edit or delete via the `⋮` menu on each card (enter 编辑模式 to drag-reorder).

### The seed way — preconfigured defaults in code

The six built-in services live in **`src/lib/initial-services.ts`**. Each entry sets id, name, URLs, category, icon, tags, and check parameters; `SEED_PROFILES` at the top controls the plausible bootstrap history (latency range + uptime) charts show on first run.

⚠️ This file only seeds the store **on first run**. If `data/store.json` already exists, code changes there won't appear. To re-seed from scratch:

1. Stop the server.
2. Delete `data/store.json` (this erases health history and services added via UI).
3. Start the server — the store re-seeds from `initial-services.ts`.

### Icons

Available icon keys are defined in `src/components/services/service-icons.ts` (lucide icons). Add a new import + map entry there to expand the picker.
