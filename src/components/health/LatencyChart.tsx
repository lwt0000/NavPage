"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { t } from "@/locales/zh-CN";
import { formatClockTime, formatLatency } from "@/lib/format";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { ChartCard, ChartTooltip } from "./ChartCard";

const AXIS_TICK = { fontSize: 11, fill: "var(--color-ink-3)" };
const GRID_STROKE = "var(--color-grid)";
const SERIES = [
  { key: "global", color: "var(--color-chart-1)", label: t.comparison.globalRoute },
  { key: "china", color: "var(--color-chart-2)", label: t.comparison.chinaRoute },
] as const;

export function LatencyChart() {
  const { snapshot } = useDashboard();
  const reduced = useReducedMotion();

  const data = useMemo(() => {
    const services = snapshot?.services ?? [];
    const globalId = services.find((s) => s.routeKey === "global")?.id;
    const chinaId = services.find((s) => s.routeKey === "china")?.id;
    if (!globalId || !chinaId) return [];
    const g = snapshot?.history.services[globalId] ?? [];
    const c = snapshot?.history.services[chinaId] ?? [];
    // Both routes are probed in the same refresh cycle, so aligning the two
    // sample sequences from the tail keeps timestamps in step.
    const n = Math.min(g.length, c.length, 40);
    const gTail = g.slice(-n);
    const cTail = c.slice(-n);
    return gTail.map((sample, i) => ({
      time: formatClockTime(new Date(sample.t)),
      global: sample.latencyMs,
      china: cTail[i]?.latencyMs ?? null,
    }));
  }, [snapshot]);

  if (data.length < 2) return null;

  const legend = (
    <div className="flex items-center gap-3.5">
      {SERIES.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-ink-2">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ background: s.color }}
            aria-hidden
          />
          {s.label}
        </span>
      ))}
    </div>
  );

  return (
    <ChartCard
      title={t.metrics.latencyTrend}
      subtitle={`Emby · ${t.charts.latency}（${t.metrics.ms}）`}
      legend={legend}
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="time"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line-strong)" }}
              minTickGap={48}
            />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    label={String(label)}
                    entries={SERIES.map((s) => {
                      const item = payload.find((p) => p.dataKey === s.key);
                      return {
                        name: s.label,
                        value:
                          item?.value != null
                            ? formatLatency(Number(item.value))
                            : t.metrics.timeout,
                        color: s.color,
                      };
                    })}
                  />
                ) : null
              }
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "var(--color-surface)",
                  fill: s.color,
                }}
                isAnimationActive={!reduced}
                animationDuration={500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      }
      table={{
        headers: [
          t.charts.time,
          `${t.comparison.globalRoute}（${t.metrics.ms}）`,
          `${t.comparison.chinaRoute}（${t.metrics.ms}）`,
        ],
        rows: data
          .slice(-12)
          .reverse()
          .map((d) => [
            d.time,
            d.global != null ? String(d.global) : "—",
            d.china != null ? String(d.china) : "—",
          ]),
      }}
    />
  );
}
