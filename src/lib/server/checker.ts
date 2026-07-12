/**
 * Server-side health checker. Probes run from the server (never the browser)
 * to avoid CORS/mixed-content issues and to keep private configuration out
 * of the frontend. 401/403/login-redirects are treated as "online —
 * authentication required" rather than failures.
 */
import type { DashboardService, HealthSnapshot, ServiceStatus } from "@/lib/types";
import { computeServiceScore, statusFromScore } from "@/lib/health";
import {
  buildSnapshot,
  getStore,
  pushActivity,
  pushOverallSample,
  pushSample,
  schedulePersist,
} from "./store";
import { serverMessages as msg } from "./messages";

type ProbeKind = "ok" | "auth" | "timeout" | "network" | "ssl" | "bad-status";

interface ProbeResult {
  kind: ProbeKind;
  httpStatus: number | null;
  latencyMs: number | null;
}

function isTimeoutError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "TimeoutError" || err.name === "AbortError")
  );
}

function isCertError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = (err as { cause?: { code?: string } }).cause;
  const code = cause?.code ?? "";
  return (
    code.includes("CERT") ||
    code.includes("UNABLE_TO_VERIFY") ||
    /certificate/i.test(err.message)
  );
}

async function probe(service: DashboardService): Promise<ProbeResult> {
  const started = performance.now();
  try {
    const res = await fetch(service.healthCheckUrl, {
      method: "GET",
      redirect: service.followRedirects ? "follow" : "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(service.timeoutMs),
      headers: { "user-agent": "WentaoCommandCenter/1.0 (+health-check)" },
    });
    const latencyMs = Math.round(performance.now() - started);
    // Release the connection without downloading the body.
    res.body?.cancel().catch(() => {});

    const status = res.status;
    if (service.expectedStatusCodes.includes(status)) {
      return { kind: "ok", httpStatus: status, latencyMs };
    }
    if (status === 401 || status === 403) {
      return { kind: "auth", httpStatus: status, latencyMs };
    }
    if (status >= 300 && status < 400) {
      const location = res.headers.get("location") ?? "";
      if (/login|sign-?in|auth/i.test(location)) {
        return { kind: "auth", httpStatus: status, latencyMs };
      }
      return { kind: "ok", httpStatus: status, latencyMs };
    }
    if (status >= 200 && status < 300) {
      return { kind: "ok", httpStatus: status, latencyMs };
    }
    return { kind: "bad-status", httpStatus: status, latencyMs };
  } catch (err) {
    if (isTimeoutError(err)) return { kind: "timeout", httpStatus: null, latencyMs: null };
    if (isCertError(err)) return { kind: "ssl", httpStatus: null, latencyMs: null };
    return { kind: "network", httpStatus: null, latencyMs: null };
  }
}

function recentStats(serviceId: string): { failureRatio: number; avgLatency: number | null } {
  const samples = getStore().history[serviceId] ?? [];
  const recent = samples.slice(-20);
  if (recent.length === 0) return { failureRatio: 0, avgLatency: null };
  const failures = recent.filter(
    (s) => s.status === "offline" || s.status === "critical",
  ).length;
  const latencies = recent
    .map((s) => s.latencyMs)
    .filter((v): v is number => v != null);
  return {
    failureRatio: failures / recent.length,
    avgLatency: latencies.length
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : null,
  };
}

function transitionActivity(
  service: DashboardService,
  prev: ServiceStatus,
  next: ServiceStatus,
  result: ProbeResult,
) {
  // First-ever check is a discovery, not a change — only surface real outages.
  if (prev === "unknown" && next !== "offline" && next !== "critical") {
    return;
  }
  const base = { serviceId: service.id, serviceName: service.name };
  if (next === "offline") {
    pushActivity({
      ...base,
      severity: "critical",
      type: "went-offline",
      message: result.kind === "timeout" ? msg.timeout : msg.wentOffline,
    });
  } else if (next === "critical") {
    pushActivity({
      ...base,
      severity: "critical",
      type: "went-critical",
      message: result.kind === "ssl" ? msg.sslIssue : msg.wentCritical,
    });
  } else if (next === "degraded") {
    pushActivity({ ...base, severity: "warning", type: "check-failed", message: msg.degraded });
  } else if (next === "authentication-required") {
    pushActivity({ ...base, severity: "info", type: "auth-required", message: msg.authRequired });
  } else if (next === "healthy") {
    const recoveredFromOutage = prev === "offline" || prev === "critical";
    pushActivity({
      ...base,
      severity: "success",
      type: "recovered",
      message: recoveredFromOutage ? msg.recovered : msg.perfRecovered,
    });
  }
}

function applyOutcome(service: DashboardService, result: ProbeResult) {
  const store = getStore();
  const now = new Date().toISOString();
  const prevStatus = service.status;
  const okLike = result.kind === "ok" || result.kind === "auth";

  service.lastCheckedAt = now;
  service.totalChecks += 1;
  if (okLike) {
    service.successfulChecks += 1;
    service.consecutiveSuccesses += 1;
    service.consecutiveFailures = 0;
    service.latencyMs = result.latencyMs;
    service.lastSuccessfulCheckAt = now;
  } else {
    service.consecutiveFailures += 1;
    service.consecutiveSuccesses = 0;
    service.latencyMs = null;
  }
  service.uptimePercentage =
    service.totalChecks > 0
      ? Math.round((service.successfulChecks / service.totalChecks) * 10000) / 100
      : 100;

  const { failureRatio, avgLatency } = recentStats(service.id);
  service.healthScore = computeServiceScore({
    ok: okLike,
    authRequired: result.kind === "auth",
    latencyMs: result.latencyMs,
    uptimePercentage: service.uptimePercentage,
    consecutiveSuccesses: service.consecutiveSuccesses,
    consecutiveFailures: service.consecutiveFailures,
    recentFailureRatio: failureRatio,
    sslIssue: result.kind === "ssl",
  });

  let nextStatus: ServiceStatus;
  if (!okLike) {
    nextStatus = service.consecutiveFailures >= 2 ? "offline" : "critical";
  } else if (result.kind === "auth") {
    nextStatus = "authentication-required";
  } else {
    nextStatus = statusFromScore(service.healthScore);
  }

  // High-latency detection, on transition only (avoids feed spam).
  if (okLike && result.latencyMs != null && avgLatency != null) {
    const threshold = Math.max(800, avgLatency * 2);
    if (!service.highLatency && result.latencyMs > threshold) {
      service.highLatency = true;
      pushActivity({
        severity: "warning",
        type: "high-latency",
        serviceId: service.id,
        serviceName: service.name,
        message: msg.highLatency(result.latencyMs),
      });
    } else if (service.highLatency && result.latencyMs < avgLatency * 1.2) {
      service.highLatency = false;
      pushActivity({
        severity: "info",
        type: "latency-normalized",
        serviceId: service.id,
        serviceName: service.name,
        message: msg.latencyNormalized,
      });
    }
  }

  if (nextStatus !== prevStatus) {
    service.lastStatusChangeAt = now;
    const isProblem = (s: ServiceStatus) =>
      s === "offline" || s === "critical" || s === "degraded";
    if (isProblem(nextStatus) && !isProblem(prevStatus)) {
      store.incidentStart[service.id] = now;
    } else if (!isProblem(nextStatus)) {
      delete store.incidentStart[service.id];
    }
    transitionActivity(service, prevStatus, nextStatus, result);
  }
  service.status = nextStatus;

  pushSample(service.id, {
    t: now,
    status: nextStatus,
    latencyMs: service.latencyMs,
    score: service.healthScore,
  });
}

export async function checkService(service: DashboardService): Promise<void> {
  let result = await probe(service);
  // Retry transient failures once before recording a failed check.
  if (result.kind === "timeout" || result.kind === "network") {
    result = await probe(service);
  }
  applyOutcome(service, result);
}

function checkableServices(): DashboardService[] {
  return getStore().services.filter(
    (s) => s.monitoringEnabled && s.status !== "maintenance",
  );
}

export async function checkAllServices(): Promise<HealthSnapshot> {
  const store = getStore();
  const targets = checkableServices();
  await Promise.all(targets.map((s) => checkService(s)));

  const snapshot = buildSnapshot();
  const { overall } = snapshot;
  store.lastFullRefreshAt = snapshot.generatedAt;
  overall.lastFullRefreshAt = snapshot.generatedAt;
  pushOverallSample({
    t: snapshot.generatedAt,
    score: overall.score,
    avgLatencyMs: overall.avgLatencyMs,
    online: overall.online,
    degraded: overall.degraded,
    offline: overall.offline + overall.critical,
  });
  schedulePersist();
  return buildSnapshot();
}

export async function checkOneService(
  id: string,
): Promise<HealthSnapshot | null> {
  const service = getStore().services.find((s) => s.id === id);
  if (!service) return null;
  if (service.monitoringEnabled && service.status !== "maintenance") {
    await checkService(service);
  }
  schedulePersist();
  return buildSnapshot();
}
