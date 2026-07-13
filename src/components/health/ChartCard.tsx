"use client";

import { useState, type ReactNode } from "react";
import { t } from "@/locales/zh-CN";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  chart: ReactNode;
  /** accessible table twin of the chart */
  table: { headers: string[]; rows: string[][] };
}

/** Glass chart panel with a 图表/表格 view toggle (every chart has a table twin). */
export function ChartCard({ title, subtitle, legend, chart, table }: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <div className="glass module-panel chart-panel p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-ink-3">{subtitle}</p>}
        </div>
        {legend}
        <div className="flex rounded-lg bg-ink/6 p-0.5" role="group">
          {(["chart", "table"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                view === mode
                  ? "bg-ink/10 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {mode === "chart" ? t.actions.viewChart : t.actions.viewTable}
            </button>
          ))}
        </div>
      </div>

      {view === "chart" ? (
        <div className="h-56">{chart}</div>
      ) : (
        <div className="max-h-56 overflow-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">{t.charts.tableCaption}</caption>
            <thead>
              <tr className="border-b border-line text-left text-ink-3">
                {table.headers.map((h) => (
                  <th key={h} className="py-2 pr-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`py-1.5 pr-3 ${j === 0 ? "text-ink-2" : "tabular-nums"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Shared glass tooltip body for Recharts. */
export function ChartTooltip({
  label,
  entries,
}: {
  label: string;
  entries: Array<{ name: string; value: string; color?: string }>;
}) {
  return (
    <div className="glass-4 px-3 py-2.5 text-xs">
      <div className="mb-1 text-[10px] text-ink-3">{label}</div>
      {entries.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          {entry.color && (
            <span
              className="inline-block h-0.5 w-3 rounded-full"
              style={{ background: entry.color }}
              aria-hidden
            />
          )}
          <span className="text-ink-2">{entry.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
