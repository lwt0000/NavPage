/**
 * File-backed in-process store for services, health history and activity.
 * Persists to data/store.json so history survives restarts; kept as a
 * globalThis singleton so Next.js dev HMR doesn't re-seed it. Swap this
 * module for a database without touching the API routes' contracts.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ActivityEvent,
  ActivitySeverity,
  ActivityType,
  DashboardService,
  HealthSample,
  HealthSnapshot,
  Incident,
  OverallSample,
  ServiceInput,
} from "@/lib/types";
import { computeOverall } from "@/lib/health";
import { createInitialServices, SEED_PROFILES } from "@/lib/initial-services";
import { serverMessages as msg } from "./messages";

const MAX_SAMPLES = 144;
const MAX_ACTIVITY = 100;

export interface StoreState {
  services: DashboardService[];
  history: Record<string, HealthSample[]>;
  overallHistory: OverallSample[];
  activity: ActivityEvent[];
  incidentStart: Record<string, string>;
  lastFullRefreshAt: string | null;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const g = globalThis as unknown as {
  __wccStore?: StoreState;
  __wccPersistTimer?: NodeJS.Timeout;
};

/* ------------------------------------------------------------------ */
/* Bootstrap                                                           */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate ~2h of plausible history so charts are populated on first run. */
function seedStore(): StoreState {
  const services = createInitialServices();
  const rng = mulberry32(20260711);
  const now = Date.now();
  const stepMs = 150_000; // 2.5 min
  const points = 48;

  const history: Record<string, HealthSample[]> = {};
  const overallHistory: OverallSample[] = [];

  for (const svc of services) {
    const profile = SEED_PROFILES[svc.id] ?? { latency: [100, 300], uptime: 99.9 };
    const [lo, hi] = profile.latency;
    const samples: HealthSample[] = [];
    for (let i = points; i >= 1; i--) {
      const t = new Date(now - i * stepMs).toISOString();
      const latencyMs = Math.round(lo + rng() * (hi - lo));
      const score = Math.max(90, Math.round(100 - (latencyMs / hi) * 8));
      samples.push({ t, status: "healthy", latencyMs, score });
    }
    history[svc.id] = samples;
  }

  for (let i = points; i >= 1; i--) {
    const t = new Date(now - i * stepMs).toISOString();
    const idx = points - i;
    let latencySum = 0;
    let scoreSum = 0;
    for (const svc of services) {
      const s = history[svc.id][idx];
      latencySum += s.latencyMs ?? 0;
      scoreSum += s.score;
    }
    overallHistory.push({
      t,
      score: Math.round(scoreSum / services.length),
      avgLatencyMs: Math.round(latencySum / services.length),
      online: services.length,
      degraded: 0,
      offline: 0,
    });
  }

  const activity: ActivityEvent[] = msg.seedEvents.map((e, i) => {
    const serviceIdx = [null, 0, 3, 2, null][i] ?? null;
    const svc = serviceIdx != null ? services[serviceIdx] : null;
    return {
      id: randomUUID(),
      t: new Date(now - (i + 1) * 22 * 60_000).toISOString(),
      severity: e.severity as ActivitySeverity,
      type: e.type as ActivityType,
      serviceId: svc?.id ?? null,
      serviceName: svc?.name ?? null,
      message: e.message,
    };
  });

  return {
    services,
    history,
    overallHistory,
    activity,
    incidentStart: {},
    lastFullRefreshAt: null,
  };
}

function load(): StoreState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      if (raw && Array.isArray(raw.services) && raw.services.length > 0) {
        return raw as StoreState;
      }
    }
  } catch {
    // fall through to a fresh seed on any corrupt file
  }
  const seeded = seedStore();
  persistNow(seeded);
  return seeded;
}

export function getStore(): StoreState {
  if (!g.__wccStore) g.__wccStore = load();
  return g.__wccStore;
}

function persistNow(state: StoreState) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(state), "utf8");
  } catch {
    // persistence is best-effort; the in-memory store remains authoritative
  }
}

export function schedulePersist() {
  if (g.__wccPersistTimer) clearTimeout(g.__wccPersistTimer);
  g.__wccPersistTimer = setTimeout(() => persistNow(getStore()), 400);
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export function pushActivity(
  event: Omit<ActivityEvent, "id" | "t"> & { t?: string },
) {
  const store = getStore();
  store.activity.unshift({
    id: randomUUID(),
    t: event.t ?? new Date().toISOString(),
    severity: event.severity,
    type: event.type,
    serviceId: event.serviceId,
    serviceName: event.serviceName,
    message: event.message,
  });
  if (store.activity.length > MAX_ACTIVITY) store.activity.length = MAX_ACTIVITY;
}

export function pushSample(serviceId: string, sample: HealthSample) {
  const store = getStore();
  const arr = store.history[serviceId] ?? (store.history[serviceId] = []);
  arr.push(sample);
  if (arr.length > MAX_SAMPLES) arr.splice(0, arr.length - MAX_SAMPLES);
}

export function pushOverallSample(sample: OverallSample) {
  const store = getStore();
  store.overallHistory.push(sample);
  if (store.overallHistory.length > MAX_SAMPLES) {
    store.overallHistory.splice(0, store.overallHistory.length - MAX_SAMPLES);
  }
}

function sanitizeUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function createService(input: ServiceInput):
  | { ok: true; service: DashboardService }
  | { ok: false; error: string } {
  const store = getStore();
  if (!input.name?.trim()) return { ok: false, error: msg.errors.nameRequired };
  const navigationUrl = sanitizeUrl(input.navigationUrl);
  if (!navigationUrl) return { ok: false, error: msg.errors.urlInvalid };
  const healthCheckUrl = sanitizeUrl(input.healthCheckUrl) ?? navigationUrl;

  const service: DashboardService = {
    id: `svc-${randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    displayUrl:
      input.displayUrl?.trim() || navigationUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    navigationUrl,
    healthCheckUrl,
    category: input.category ?? "productivity",
    tags: input.tags ?? [],
    icon: input.icon ?? "globe",
    priority: input.priority ?? "medium",
    favorite: input.favorite ?? false,
    admin: input.admin ?? false,
    routeLabel: input.routeLabel,
    routeKey: input.routeKey,
    status: "unknown",
    healthScore: 0,
    latencyMs: null,
    uptimePercentage: 100,
    lastCheckedAt: null,
    lastSuccessfulCheckAt: null,
    expectedStatusCodes: input.expectedStatusCodes?.length
      ? input.expectedStatusCodes
      : [200],
    timeoutMs: input.timeoutMs ?? 8000,
    checkIntervalSeconds: input.checkIntervalSeconds ?? 60,
    openInNewTab: input.openInNewTab ?? true,
    authMode: input.authMode ?? "none",
    followRedirects: input.followRedirects ?? true,
    monitoringEnabled: input.monitoringEnabled ?? true,
    accent: input.accent,
    order: store.services.length
      ? Math.max(...store.services.map((s) => s.order)) + 1
      : 0,
    consecutiveSuccesses: 0,
    consecutiveFailures: 0,
    totalChecks: 0,
    successfulChecks: 0,
    lastStatusChangeAt: null,
    highLatency: false,
  };

  store.services.push(service);
  store.history[service.id] = [];
  pushActivity({
    severity: "info",
    type: "service-added",
    serviceId: service.id,
    serviceName: service.name,
    message: msg.serviceAdded(service.name),
  });
  schedulePersist();
  return { ok: true, service };
}

export function updateService(
  id: string,
  patch: Partial<DashboardService>,
): { ok: true; service: DashboardService } | { ok: false; error: string } {
  const store = getStore();
  const service = store.services.find((s) => s.id === id);
  if (!service) return { ok: false, error: msg.errors.notFound };

  const wasMaintenance = service.status === "maintenance";

  if (patch.navigationUrl !== undefined) {
    const nav = sanitizeUrl(patch.navigationUrl);
    if (!nav) return { ok: false, error: msg.errors.urlInvalid };
    patch.navigationUrl = nav;
  }
  if (patch.healthCheckUrl !== undefined) {
    const hc = sanitizeUrl(patch.healthCheckUrl);
    patch.healthCheckUrl = hc ?? service.navigationUrl;
  }

  // Only allow known mutable fields through.
  const mutable: (keyof DashboardService)[] = [
    "name", "description", "displayUrl", "navigationUrl", "healthCheckUrl",
    "category", "tags", "icon", "priority", "favorite", "admin", "routeLabel",
    "routeKey", "expectedStatusCodes", "timeoutMs", "checkIntervalSeconds",
    "openInNewTab", "authMode", "followRedirects", "monitoringEnabled",
    "accent", "status",
  ];
  const significant: (keyof DashboardService)[] = [
    "navigationUrl", "healthCheckUrl", "expectedStatusCodes", "timeoutMs",
    "authMode", "followRedirects", "monitoringEnabled",
  ];
  let significantChange = false;
  for (const key of mutable) {
    if (patch[key] !== undefined) {
      if (key === "status") {
        // status may only be toggled to/from maintenance via the API
        if (patch.status !== "maintenance" && !wasMaintenance) continue;
        if (patch.status === "maintenance" || wasMaintenance) {
          (service as unknown as Record<string, unknown>)[key] = patch.status === "maintenance" ? "maintenance" : "unknown";
        }
        continue;
      }
      if (significant.includes(key)) significantChange = true;
      (service as unknown as Record<string, unknown>)[key] = patch[key];
    }
  }

  if (!wasMaintenance && service.status === "maintenance") {
    pushActivity({
      severity: "info",
      type: "maintenance-started",
      serviceId: service.id,
      serviceName: service.name,
      message: msg.maintenanceStarted,
    });
  } else if (wasMaintenance && service.status !== "maintenance") {
    pushActivity({
      severity: "info",
      type: "maintenance-ended",
      serviceId: service.id,
      serviceName: service.name,
      message: msg.maintenanceEnded,
    });
  } else if (significantChange) {
    pushActivity({
      severity: "info",
      type: "config-updated",
      serviceId: service.id,
      serviceName: service.name,
      message: msg.serviceUpdated(service.name),
    });
  }

  schedulePersist();
  return { ok: true, service };
}

export function deleteService(
  id: string,
): { ok: true } | { ok: false; error: string } {
  const store = getStore();
  const idx = store.services.findIndex((s) => s.id === id);
  if (idx === -1) return { ok: false, error: msg.errors.notFound };
  const [removed] = store.services.splice(idx, 1);
  delete store.history[id];
  delete store.incidentStart[id];
  pushActivity({
    severity: "info",
    type: "service-removed",
    serviceId: null,
    serviceName: removed.name,
    message: msg.serviceRemoved(removed.name),
  });
  schedulePersist();
  return { ok: true };
}

export function reorderServices(ids: string[]) {
  const store = getStore();
  const orderMap = new Map(ids.map((id, i) => [id, i]));
  for (const s of store.services) {
    const next = orderMap.get(s.id);
    if (next !== undefined) s.order = next;
  }
  store.services.sort((a, b) => a.order - b.order);
  schedulePersist();
}

/* ------------------------------------------------------------------ */
/* Snapshot                                                            */
/* ------------------------------------------------------------------ */

export function buildSnapshot(): HealthSnapshot {
  const store = getStore();
  const services = [...store.services].sort((a, b) => a.order - b.order);

  const incidents: Incident[] = services
    .filter((s) =>
      s.status === "offline" || s.status === "critical" || s.status === "degraded",
    )
    .map((s) => ({
      id: `incident-${s.id}`,
      serviceId: s.id,
      serviceName: s.name,
      status: s.status,
      startedAt:
        store.incidentStart[s.id] ??
        s.lastStatusChangeAt ??
        new Date().toISOString(),
      message: msg.incident[s.status] ?? msg.incident.degraded,
    }));

  return {
    services,
    overall: computeOverall(services, store.lastFullRefreshAt),
    incidents,
    activity: store.activity,
    history: {
      services: store.history,
      overall: store.overallHistory,
    },
    generatedAt: new Date().toISOString(),
  };
}
