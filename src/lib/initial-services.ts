/**
 * The six preconfigured real services. User-facing text is Simplified Chinese;
 * identifiers and structure are English. Seed latency ranges drive the
 * plausible bootstrap history generated on first run (replaced by real
 * server-side checks as soon as the dashboard starts polling).
 */
import type { DashboardService } from "./types";

interface SeedProfile {
  /** typical latency range in ms for bootstrap history */
  latency: [number, number];
  uptime: number;
}

export const SEED_PROFILES: Record<string, SeedProfile> = {
  "wentao-site": { latency: [70, 160], uptime: 99.98 },
  moviepilot: { latency: [120, 260], uptime: 99.9 },
  "emby-global": { latency: [90, 210], uptime: 99.95 },
  "emby-china": { latency: [240, 480], uptime: 99.6 },
  "file-transfer": { latency: [100, 220], uptime: 99.92 },
  "routerman-vpn": { latency: [150, 320], uptime: 99.85 },
};

const common = {
  status: "unknown" as const,
  healthScore: 0,
  latencyMs: null,
  lastCheckedAt: null,
  lastSuccessfulCheckAt: null,
  lastStatusChangeAt: null,
  consecutiveSuccesses: 0,
  consecutiveFailures: 0,
  highLatency: false,
  openInNewTab: true,
  monitoringEnabled: true,
  followRedirects: true,
  expectedStatusCodes: [200],
  timeoutMs: 8000,
  checkIntervalSeconds: 60,
};

/** Seed rolling uptime counters ≈ 30 days of 15-minute checks. */
function seedCounters(uptime: number) {
  const totalChecks = 2880;
  const successfulChecks = Math.round((totalChecks * uptime) / 100);
  return { totalChecks, successfulChecks, uptimePercentage: uptime };
}

export function createInitialServices(): DashboardService[] {
  return [
    {
      ...common,
      ...seedCounters(SEED_PROFILES["wentao-site"].uptime),
      id: "wentao-site",
      name: "个人简历主页",
      description: "个人主页、简历、项目经历与职业信息展示。",
      displayUrl: "wentao.cloud",
      navigationUrl: "https://wentao.cloud",
      healthCheckUrl: "https://wentao.cloud",
      category: "personal",
      tags: ["个人主页", "简历", "作品集"],
      icon: "user",
      priority: "high",
      favorite: true,
      admin: false,
      authMode: "none",
      order: 0,
    },
    {
      ...common,
      ...seedCounters(SEED_PROFILES.moviepilot.uptime),
      id: "moviepilot",
      name: "MoviePilot 影视订阅",
      description: "电影与电视剧订阅、资源管理和自动化下载服务。",
      displayUrl: "mp.wentao.cloud",
      navigationUrl: "https://mp.wentao.cloud",
      healthCheckUrl: "https://mp.wentao.cloud",
      category: "media",
      tags: ["影视订阅", "资源管理", "自动化"],
      icon: "clapperboard",
      priority: "high",
      favorite: true,
      admin: false,
      authMode: "expected",
      order: 1,
    },
    {
      ...common,
      ...seedCounters(SEED_PROFILES["emby-global"].uptime),
      id: "emby-global",
      name: "Emby 海外线路",
      description: "面向加拿大及其他海外地区访问的 Emby 影视媒体库。",
      displayUrl: "emby.wentao.cloud",
      navigationUrl: "https://emby.wentao.cloud",
      healthCheckUrl: "https://emby.wentao.cloud",
      category: "media",
      tags: ["Emby", "影视库", "海外线路"],
      icon: "monitor-play",
      priority: "high",
      favorite: true,
      admin: false,
      routeLabel: "海外线路",
      routeKey: "global",
      authMode: "none",
      order: 2,
    },
    {
      ...common,
      ...seedCounters(SEED_PROFILES["emby-china"].uptime),
      id: "emby-china",
      name: "Emby 中国线路",
      description: "针对中国大陆网络访问进行优化的 Emby 影视媒体库。",
      displayUrl: "emby.discman.dpdns.org",
      navigationUrl: "https://emby.discman.dpdns.org",
      healthCheckUrl: "https://emby.discman.dpdns.org",
      category: "media",
      tags: ["Emby", "影视库", "中国线路"],
      icon: "server",
      priority: "high",
      favorite: true,
      admin: false,
      routeLabel: "中国线路",
      routeKey: "china",
      authMode: "none",
      timeoutMs: 10000,
      order: 3,
    },
    {
      ...common,
      ...seedCounters(SEED_PROFILES["file-transfer"].uptime),
      id: "file-transfer",
      name: "文件传输助手",
      description: "用于快速上传、分享和传输文件的个人文件工具。",
      displayUrl: "file.wentao.cloud",
      navigationUrl: "https://file.wentao.cloud",
      healthCheckUrl: "https://file.wentao.cloud",
      category: "productivity",
      tags: ["文件", "传输", "分享"],
      icon: "folder",
      priority: "medium",
      favorite: true,
      admin: false,
      authMode: "none",
      order: 4,
    },
    {
      ...common,
      ...seedCounters(SEED_PROFILES["routerman-vpn"].uptime),
      id: "routerman-vpn",
      name: "VPN 订阅管理",
      description: "个人 VPN 订阅与网络服务管理后台。",
      displayUrl: "routerman.ccwu.cc/admin",
      navigationUrl: "https://routerman.ccwu.cc/admin",
      // The /admin page requires login, so the health check probes the
      // public root instead — separate from the navigation URL by design.
      healthCheckUrl: "https://routerman.ccwu.cc",
      category: "infrastructure",
      tags: ["VPN", "订阅管理", "网络服务"],
      icon: "shield",
      priority: "high",
      favorite: true,
      admin: true,
      authMode: "expected",
      order: 5,
    },
  ];
}
