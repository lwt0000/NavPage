/**
 * Pure health-score logic, shared by server checker and client UI.
 * Score ranges: 90-100 healthy, 70-89 degraded, 1-69 critical, 0 offline.
 */
import type {
  DashboardService,
  OverallHealth,
  ServicePriority,
  ServiceStatus,
} from "./types";

const PRIORITY_WEIGHT: Record<ServicePriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** 0-100 sub-score from response latency. */
export function latencyScore(ms: number | null): number {
  if (ms == null) return 0;
  if (ms <= 200) return 100;
  if (ms <= 600) return 100 - ((ms - 200) / 400) * 30;
  if (ms <= 1500) return 70 - ((ms - 600) / 900) * 25;
  if (ms <= 4000) return 45 - ((ms - 1500) / 2500) * 25;
  return 15;
}

export interface ScoreInput {
  ok: boolean;
  authRequired: boolean;
  latencyMs: number | null;
  uptimePercentage: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  /** share of failed checks among the recent sample window, 0-1 */
  recentFailureRatio: number;
  sslIssue?: boolean;
}

export function computeServiceScore(input: ScoreInput): number {
  if (!input.ok && !input.authRequired) {
    // A failed check (the checker already retried once). Two misses in a row
    // means offline (0); a single blip lands in the critical band.
    return input.consecutiveFailures >= 2 ? 0 : 25;
  }

  const availability = clamp(((input.uptimePercentage - 95) / 5) * 100, 0, 100);
  const latency = latencyScore(input.latencyMs);
  // Neutral 80 baseline: a fresh healthy service isn't punished for having no
  // streak yet, while recent failures still pull the score down sharply.
  const stability = clamp(
    80 + Math.min(input.consecutiveSuccesses, 10) * 2 -
      input.recentFailureRatio * 160,
    0,
    100,
  );

  let score = 0.45 * availability + 0.3 * latency + 0.25 * stability;
  if (input.sslIssue) score = Math.min(score, 60);
  return clamp(Math.round(score), 1, 100);
}

/** Map a score to a display status (for services that responded). */
export function statusFromScore(score: number): ServiceStatus {
  if (score >= 90) return "healthy";
  if (score >= 70) return "degraded";
  if (score >= 1) return "critical";
  return "offline";
}

const ONLINE_STATUSES: ServiceStatus[] = [
  "healthy",
  "degraded",
  "authentication-required",
];

export function isOnline(status: ServiceStatus): boolean {
  return ONLINE_STATUSES.includes(status);
}

export function computeOverall(
  services: DashboardService[],
  lastFullRefreshAt: string | null,
): OverallHealth {
  const counts = {
    online: 0,
    degraded: 0,
    critical: 0,
    offline: 0,
    authRequired: 0,
    maintenance: 0,
    unknown: 0,
  };
  let weightedScore = 0;
  let weightedUptime = 0;
  let weightSum = 0;
  let latencySum = 0;
  let latencyCount = 0;

  for (const s of services) {
    switch (s.status) {
      case "healthy":
        counts.online += 1;
        break;
      case "degraded":
        counts.online += 1;
        counts.degraded += 1;
        break;
      case "authentication-required":
        counts.online += 1;
        counts.authRequired += 1;
        break;
      case "critical":
        counts.critical += 1;
        break;
      case "offline":
        counts.offline += 1;
        break;
      case "maintenance":
        counts.maintenance += 1;
        break;
      default:
        counts.unknown += 1;
    }

    // Maintenance and never-checked services do not drag the overall score.
    if (s.monitoringEnabled && s.status !== "maintenance" && s.status !== "unknown") {
      const w = PRIORITY_WEIGHT[s.priority];
      weightSum += w;
      weightedScore += s.healthScore * w;
      weightedUptime += s.uptimePercentage * w;
    }
    if (s.latencyMs != null && isOnline(s.status)) {
      latencySum += s.latencyMs;
      latencyCount += 1;
    }
  }

  const monitored = services.filter((s) => s.monitoringEnabled).length;
  const score = weightSum > 0 ? Math.round(weightedScore / weightSum) : 0;
  const activeIncidents = counts.critical + counts.offline + counts.degraded;

  let status: ServiceStatus = "healthy";
  if (weightSum === 0) status = "unknown";
  else if (counts.offline > 0) status = "offline";
  else if (counts.critical > 0) status = "critical";
  else if (counts.degraded > 0) status = "degraded";
  else if (counts.maintenance > 0 && counts.online === 0) status = "maintenance";

  return {
    score,
    status,
    monitored,
    online: counts.online,
    degraded: counts.degraded,
    critical: counts.critical,
    offline: counts.offline,
    authRequired: counts.authRequired,
    maintenance: counts.maintenance,
    unknown: counts.unknown,
    avgLatencyMs: latencyCount > 0 ? Math.round(latencySum / latencyCount) : null,
    totalUptime:
      weightSum > 0 ? Math.round((weightedUptime / weightSum) * 100) / 100 : 0,
    activeIncidents,
    lastFullRefreshAt,
  };
}

/* ------------------------------------------------------------------ */
/* Emby route comparison                                               */
/* ------------------------------------------------------------------ */

export type RouteCode =
  | "both-ok"
  | "global-faster"
  | "china-faster"
  | "china-hint"
  | "global-degraded"
  | "china-degraded"
  | "china-down"
  | "global-down"
  | "both-down"
  | "unknown";

export interface RouteRecommendation {
  /** headline code first, optional secondary hint after */
  codes: RouteCode[];
  recommendedId: string | null;
}

export function compareRoutes(
  global: DashboardService | undefined,
  china: DashboardService | undefined,
): RouteRecommendation {
  if (!global || !china) return { codes: ["unknown"], recommendedId: null };
  const down = (s: DashboardService) =>
    s.status === "offline" || s.status === "critical";
  const unknown = (s: DashboardService) => s.status === "unknown";

  if (unknown(global) && unknown(china))
    return { codes: ["unknown"], recommendedId: null };
  if (down(global) && down(china))
    return { codes: ["both-down"], recommendedId: null };
  if (down(china))
    return { codes: ["china-down"], recommendedId: global.id };
  if (down(global))
    return { codes: ["global-down"], recommendedId: china.id };
  if (china.status === "degraded" && global.status !== "degraded")
    return { codes: ["china-degraded"], recommendedId: global.id };
  if (global.status === "degraded" && china.status !== "degraded")
    return { codes: ["global-degraded"], recommendedId: china.id };

  const g = global.latencyMs;
  const c = china.latencyMs;
  if (g != null && c != null) {
    const threshold = Math.max(25, Math.max(g, c) * 0.15);
    if (g + threshold < c)
      return { codes: ["global-faster", "china-hint"], recommendedId: global.id };
    if (c + threshold < g)
      return { codes: ["china-faster"], recommendedId: china.id };
  }
  return { codes: ["both-ok", "china-hint"], recommendedId: null };
}
