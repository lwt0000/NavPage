"use client";

import { useMemo } from "react";
import { ArrowLeftRight, BadgeCheck } from "lucide-react";
import type { DashboardService } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { compareRoutes } from "@/lib/health";
import { formatLatency, formatPercent, formatRelative } from "@/lib/format";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { useNow } from "@/components/ui/useNow";
import { StatusBadge } from "./StatusBadge";

function avgLatency(samples: Array<{ latencyMs: number | null }>): number | null {
  const values = samples
    .slice(-12)
    .map((s) => s.latencyMs)
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function RoutePanel({
  service,
  color,
  recommended,
  maxLatency,
  avg,
  now,
}: {
  service: DashboardService;
  color: string;
  recommended: boolean;
  maxLatency: number;
  avg: number | null;
  now: number;
}) {
  const { openService } = useDashboard();
  const width =
    service.latencyMs != null && maxLatency > 0
      ? Math.max(6, (service.latencyMs / maxLatency) * 100)
      : 0;

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-2xl border p-4 transition-colors ${
        recommended ? "border-accent/45 bg-accent/8" : "border-line bg-canvas/25"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        <span className="text-xs font-semibold">{service.routeLabel}</span>
        <span className="truncate text-[11px] text-ink-3">{service.displayUrl}</span>
        {recommended && (
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
            <BadgeCheck size={11} aria-hidden />
            {t.comparison.recommendedRoute}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] text-ink-3">{t.comparison.currentLatency}</div>
          <div className="text-2xl font-semibold leading-tight">
            {service.latencyMs != null ? (
              <>
                {service.latencyMs}
                <span className="ml-1 text-xs font-normal text-ink-3">
                  {t.metrics.ms}
                </span>
              </>
            ) : (
              "—"
            )}
          </div>
        </div>
        <StatusBadge status={service.status} size="sm" />
      </div>

      {/* latency comparison bar (thin mark, shared scale, slow flow sheen) */}
      <div
        className="route-track h-1.5 rounded-full bg-ink/8"
        title={`${t.comparison.currentLatency}：${formatLatency(service.latencyMs)}`}
        aria-hidden
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${width}%`, background: color }}
        />
      </div>

      <dl className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <dt className="text-ink-3">{t.comparison.averageLatency}</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {avg != null ? formatLatency(avg) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">{t.metrics.uptime}</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatPercent(service.uptimePercentage, 2)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">{t.comparison.lastSuccessfulCheck}</dt>
          <dd className="mt-0.5 font-medium">
            {formatRelative(service.lastSuccessfulCheckAt, now)}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => openService(service)}
        className="control-button mt-1 self-start px-3 py-1.5 text-[11px] font-medium text-ink-2 transition-colors hover:text-ink"
      >
        {t.actions.open}
      </button>
    </div>
  );
}

export function RouteComparison() {
  const { snapshot } = useDashboard();
  const now = useNow(15_000);

  const routes = useMemo(() => {
    const services = snapshot?.services ?? [];
    const global = services.find((s) => s.routeKey === "global");
    const china = services.find((s) => s.routeKey === "china");
    return { global, china };
  }, [snapshot]);

  if (!routes.global || !routes.china || !snapshot) return null;
  const { global, china } = routes;

  const recommendation = compareRoutes(global, china);
  const [headline, ...hints] = recommendation.codes;
  const maxLatency = Math.max(global.latencyMs ?? 0, china.latencyMs ?? 0);
  const globalAvg = avgLatency(snapshot.history.services[global.id] ?? []);
  const chinaAvg = avgLatency(snapshot.history.services[china.id] ?? []);

  return (
    <section id="route-comparison" aria-label={t.comparison.title} className="glass module-panel p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="module-icon grid size-9 place-items-center text-ink-2">
          <ArrowLeftRight size={16} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="section-kicker mb-1">{t.workspace.routeAnalysis}</p>
          <h2 className="text-sm font-semibold">{t.comparison.title}</h2>
          <p className="mt-0.5 text-[11px] text-ink-3">
            {hints.length > 0
              ? t.comparison.recommendation[hints[0]]
              : `Emby · ${t.comparison.globalRoute} / ${t.comparison.chinaRoute}`}
          </p>
        </div>
        <span className="rounded-full bg-soft px-3 py-1.5 text-xs font-medium text-ink-2">
          {t.comparison.recommendation[headline]}
        </span>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2">
        <RoutePanel
          service={global}
          color="var(--color-chart-1)"
          recommended={recommendation.recommendedId === global.id}
          maxLatency={maxLatency}
          avg={globalAvg}
          now={now}
        />
        <RoutePanel
          service={china}
          color="var(--color-chart-2)"
          recommended={recommendation.recommendedId === china.id}
          maxLatency={maxLatency}
          avg={chinaAvg}
          now={now}
        />
      </div>
    </section>
  );
}
