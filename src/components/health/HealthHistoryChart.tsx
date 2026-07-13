"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { t } from "@/locales/zh-CN";
import { formatClockTime } from "@/lib/format";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { ChartCard, ChartTooltip } from "./ChartCard";

const AXIS_TICK = { fontSize: 11, fill: "var(--color-ink-3)" };
const GRID_STROKE = "var(--color-grid)";

export function HealthHistoryChart() {
  const { snapshot } = useDashboard();
  const reduced = useReducedMotion();

  const data = useMemo(
    () =>
      (snapshot?.history.overall ?? []).map((s) => ({
        time: formatClockTime(new Date(s.t)),
        score: s.score,
      })),
    [snapshot],
  );

  if (data.length < 2) return null;

  return (
    <ChartCard
      title={t.metrics.healthHistory}
      subtitle={`${t.header.overallHealth} · ${t.charts.health}%`}
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="time"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line-strong)" }}
              minTickGap={48}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    label={String(label)}
                    entries={[
                      {
                        name: t.charts.health,
                        value: `${payload[0].value}%`,
                        color: "var(--color-chart-1)",
                      },
                    ]}
                  />
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="var(--color-chart-1)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: "var(--color-surface)",
                fill: "var(--color-chart-1)",
              }}
              isAnimationActive={!reduced}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      }
      table={{
        headers: [t.charts.time, `${t.charts.health}（%）`],
        rows: data
          .slice(-12)
          .reverse()
          .map((d) => [d.time, String(d.score)]),
      }}
    />
  );
}
