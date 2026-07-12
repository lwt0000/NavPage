"use client";

import { useMemo } from "react";
import { Gauge, Rabbit, RotateCcw, Turtle } from "lucide-react";
import { t } from "@/locales/zh-CN";
import {
  formatLatency,
  formatPercent,
  formatRelative,
} from "@/lib/format";
import { isOnline } from "@/lib/health";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { Sparkline } from "@/components/ui/Sparkline";
import { useNow } from "@/components/ui/useNow";
import { STATUS_META } from "@/components/services/status-meta";
import type { ServiceStatus } from "@/lib/types";
import { OverallHealthGauge } from "./OverallHealthGauge";

/** Stat tile: label · value (proportional figures) · optional trend. */
function HealthSummaryCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number[];
}) {
  return (
    <div className="well @container flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <div className="truncate text-[11px] text-ink-3">{label}</div>
        <div className="mt-1 truncate text-xl font-semibold leading-none">
          {value}
        </div>
        {sub && <div className="mt-1.5 truncate text-[11px] text-ink-3">{sub}</div>}
      </div>
      {/* trend needs breathing room; drop it before it crushes the figures */}
      {trend && trend.length > 1 && (
        <div className="hidden shrink-0 @min-[13.5rem]:block">
          <Sparkline values={trend} />
        </div>
      )}
    </div>
  );
}

function DistributionBar() {
  const { snapshot } = useDashboard();
  const services = snapshot?.services ?? [];
  if (services.length === 0) return null;

  const order: ServiceStatus[] = [
    "healthy",
    "authentication-required",
    "degraded",
    "critical",
    "offline",
    "maintenance",
    "unknown",
  ];
  const segments = order
    .map((status) => ({
      status,
      meta: STATUS_META[status],
      count: services.filter((s) => s.status === status).length,
    }))
    .filter((seg) => seg.count > 0);

  return (
    <div>
      <div className="mb-2 text-[11px] text-ink-3">{t.metrics.distribution}</div>
      {/* 2px surface gaps separate the fills */}
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {segments.map((seg) => (
          <div
            key={seg.status}
            className="rounded-full transition-all duration-500"
            style={{
              flexGrow: seg.count,
              background: seg.meta.dot,
            }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((seg) => {
          const Icon = seg.meta.icon;
          return (
            <span
              key={seg.status}
              className="inline-flex items-center gap-1.5 text-[11px] text-ink-2"
            >
              <Icon size={11.5} className={seg.meta.text} aria-hidden />
              {t.status[seg.status]}
              <span className="font-semibold tabular-nums">{seg.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function HealthOverview() {
  const { snapshot } = useDashboard();
  const now = useNow(15_000);

  const extremes = useMemo(() => {
    const services = snapshot?.services ?? [];
    const online = services.filter((s) => isOnline(s.status) && s.latencyMs != null);
    const slowest = online.length
      ? online.reduce((a, b) => ((a.latencyMs ?? 0) >= (b.latencyMs ?? 0) ? a : b))
      : null;
    const fastest = online.length
      ? online.reduce((a, b) => ((a.latencyMs ?? 0) <= (b.latencyMs ?? 0) ? a : b))
      : null;
    const recovered = snapshot?.activity.find(
      (e) => e.type === "recovered" && e.serviceName,
    );
    return { slowest, fastest, recovered };
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="glass p-6" id="health-overview" aria-hidden>
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="skeleton size-44 rounded-full!" />
          <div className="grid flex-1 grid-cols-2 gap-3 self-stretch xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { overall } = snapshot;
  const latencyTrend = snapshot.history.overall
    .slice(-12)
    .map((s) => s.avgLatencyMs ?? 0);

  return (
    <section
      id="health-overview"
      aria-label={t.metrics.healthOverview}
      className="glass p-5 sm:p-6"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* hero gauge */}
        <div className="flex shrink-0 flex-col items-center gap-2 lg:px-4">
          <OverallHealthGauge score={overall.score} status={overall.status} />
          <p className="text-[11px] text-ink-3">
            {t.metrics.servicesOnlineOf(overall.online, overall.monitored)}
          </p>
        </div>

        {/* stat tiles + distribution */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HealthSummaryCard
              label={t.metrics.avgResponse}
              value={formatLatency(overall.avgLatencyMs)}
              trend={latencyTrend}
            />
            <HealthSummaryCard
              label={t.metrics.totalUptime}
              value={formatPercent(overall.totalUptime, 2)}
            />
            <HealthSummaryCard
              label={t.metrics.availability}
              value={
                overall.monitored > 0
                  ? formatPercent((overall.online / overall.monitored) * 100, 0)
                  : "—"
              }
              sub={`${overall.online} / ${overall.monitored}`}
            />
            <HealthSummaryCard
              label={t.metrics.activeIncidents}
              value={String(overall.activeIncidents)}
              sub={
                overall.activeIncidents === 0
                  ? t.metrics.noIncidents
                  : `${t.metrics.lastFullRefresh} ${formatRelative(overall.lastFullRefreshAt, now)}`
              }
            />
          </div>

          <DistributionBar />

          {/* extremes */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/45 px-3.5 py-2.5 shadow-sm">
              <Turtle size={15} className="shrink-0 text-warn" aria-hidden />
              <div className="min-w-0 text-xs">
                <div className="text-[10px] text-ink-3">{t.metrics.slowestService}</div>
                <div className="truncate font-medium">
                  {extremes.slowest
                    ? `${extremes.slowest.name} · ${formatLatency(extremes.slowest.latencyMs)}`
                    : t.metrics.noData}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/45 px-3.5 py-2.5 shadow-sm">
              <Rabbit size={15} className="shrink-0 text-ok" aria-hidden />
              <div className="min-w-0 text-xs">
                <div className="text-[10px] text-ink-3">{t.metrics.fastestService}</div>
                <div className="truncate font-medium">
                  {extremes.fastest
                    ? `${extremes.fastest.name} · ${formatLatency(extremes.fastest.latencyMs)}`
                    : t.metrics.noData}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/45 px-3.5 py-2.5 shadow-sm">
              <RotateCcw size={15} className="shrink-0 text-maint" aria-hidden />
              <div className="min-w-0 text-xs">
                <div className="text-[10px] text-ink-3">{t.metrics.lastRecovered}</div>
                <div className="truncate font-medium">
                  {extremes.recovered
                    ? `${extremes.recovered.serviceName} · ${formatRelative(extremes.recovered.t, now)}`
                    : t.metrics.noData}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
