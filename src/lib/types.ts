/** Core typed data model for services, health checks, incidents, categories and activity. */

export type ServiceStatus =
  | "healthy"
  | "degraded"
  | "critical"
  | "offline"
  | "maintenance"
  | "authentication-required"
  | "unknown";

export type ServiceCategory =
  | "personal"
  | "media"
  | "productivity"
  | "infrastructure";

export type ServicePriority = "low" | "medium" | "high";

/** How auth responses (401/403/login redirects) are interpreted by the checker. */
export type AuthMode = "none" | "expected";

export type RouteKey = "global" | "china";

export interface DashboardService {
  id: string;
  name: string;
  description: string;
  displayUrl: string;
  navigationUrl: string;
  healthCheckUrl: string;
  category: ServiceCategory;
  tags: string[];
  icon: string;
  priority: ServicePriority;
  favorite: boolean;
  admin: boolean;
  routeLabel?: string;
  routeKey?: RouteKey;
  status: ServiceStatus;
  healthScore: number;
  latencyMs: number | null;
  uptimePercentage: number;
  lastCheckedAt: string | null;
  lastSuccessfulCheckAt: string | null;
  expectedStatusCodes: number[];
  timeoutMs: number;
  checkIntervalSeconds: number;
  openInNewTab: boolean;
  authMode: AuthMode;
  followRedirects: boolean;
  monitoringEnabled: boolean;
  accent?: string;
  order: number;
  /* Rolling check bookkeeping (server-maintained) */
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  totalChecks: number;
  successfulChecks: number;
  lastStatusChangeAt: string | null;
  highLatency: boolean;
}

/** Fields a user supplies when creating/editing a service. */
export type ServiceInput = Partial<
  Omit<
    DashboardService,
    | "id"
    | "status"
    | "healthScore"
    | "latencyMs"
    | "lastCheckedAt"
    | "lastSuccessfulCheckAt"
    | "consecutiveSuccesses"
    | "consecutiveFailures"
    | "totalChecks"
    | "successfulChecks"
    | "lastStatusChangeAt"
    | "highLatency"
    | "order"
  >
> & { name: string; navigationUrl: string };

export interface HealthSample {
  /** ISO timestamp */
  t: string;
  status: ServiceStatus;
  latencyMs: number | null;
  score: number;
}

export interface OverallSample {
  t: string;
  score: number;
  avgLatencyMs: number | null;
  online: number;
  degraded: number;
  offline: number;
}

export type ActivitySeverity = "info" | "success" | "warning" | "critical";

export type ActivityType =
  | "recovered"
  | "went-offline"
  | "went-critical"
  | "high-latency"
  | "latency-normalized"
  | "check-failed"
  | "auth-required"
  | "service-added"
  | "service-updated"
  | "service-removed"
  | "config-updated"
  | "maintenance-started"
  | "maintenance-ended"
  | "ssl-expiring"
  | "api-restored"
  | "system";

export interface ActivityEvent {
  id: string;
  t: string;
  severity: ActivitySeverity;
  type: ActivityType;
  serviceId: string | null;
  serviceName: string | null;
  message: string;
}

export interface Incident {
  id: string;
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  startedAt: string;
  message: string;
}

export interface OverallHealth {
  score: number;
  status: ServiceStatus;
  monitored: number;
  online: number;
  degraded: number;
  critical: number;
  offline: number;
  authRequired: number;
  maintenance: number;
  unknown: number;
  avgLatencyMs: number | null;
  totalUptime: number;
  activeIncidents: number;
  lastFullRefreshAt: string | null;
}

export interface HealthSnapshot {
  services: DashboardService[];
  overall: OverallHealth;
  incidents: Incident[];
  activity: ActivityEvent[];
  history: {
    services: Record<string, HealthSample[]>;
    overall: OverallSample[];
  };
  generatedAt: string;
}

export type CategoryKey = "all" | "favorites" | ServiceCategory | "offline";

export const REFRESH_INTERVALS: Array<{ seconds: number | null }> = [
  { seconds: 10 },
  { seconds: 30 },
  { seconds: 60 },
  { seconds: 300 },
  { seconds: 900 },
  { seconds: null }, // manual only
];
