"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import type { OverallSample, ServiceStatus } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { formatRelative } from "@/lib/format";
import { StatusBadge } from "@/components/services/StatusBadge";
import { scoreColor } from "@/components/services/status-meta";
import { useNow } from "@/components/ui/useNow";

function useAnimatedScore(score: number): number {
  const [display, setDisplay] = useState(score);
  const prev = useRef(score);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      prev.current = score;
      setDisplay(score);
      return;
    }
    const controls = animate(prev.current, score, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = score;
    return () => controls.stop();
  }, [score, reduced]);
  return display;
}

interface GaugeProps {
  score: number;
  status: ServiceStatus;
  /** overall health history; the trend bar shows the most recent samples */
  history?: OverallSample[];
  size?: number;
}

/** One trend slot per health-history sample (last TREND_SLOTS checks). */
const TREND_SLOTS = 12;

/** Compact industrial readout — a deliberate alternative to a generic radial gauge. */
export function OverallHealthGauge({ score, status, history, size = 196 }: GaugeProps) {
  const display = useAnimatedScore(score);
  const color = scoreColor(score);
  const now = useNow(30_000);
  const samples = (history ?? []).slice(-TREND_SLOTS);

  return (
    <div
      className="relative flex flex-col justify-between rounded-2xl border border-line bg-canvas/40 p-4"
      style={{ width: size, height: size }}
      role="img"
      aria-label={t.a11y.healthGauge(score)}
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-medium text-ink-3">{t.workspace.healthReadout}</span>
        <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
      </div>
      <div>
        <div className="flex items-end leading-none">
          <span className="text-6xl font-semibold tracking-[-0.03em] tabular-nums">
            {display}
          </span>
          <span className="mb-1 ml-1 text-sm text-ink-3">%</span>
        </div>
        <div className="mt-2 text-[11px] text-ink-3">{t.header.overallHealth}</div>
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between text-[10px] text-ink-3">
          <span>{t.metrics.healthHistory}</span>
          <span>
            {samples.length > 0
              ? t.metrics.recentChecks(samples.length)
              : t.metrics.noData}
          </span>
        </div>
        {/* bar per history sample: height = score, muted past, bright latest */}
        <div className="mb-2 flex h-4 items-end gap-1" aria-hidden>
          {Array.from({ length: TREND_SLOTS - samples.length }, (_, i) => (
            <span
              key={`empty-${i}`}
              className="flex-1 rounded-full"
              style={{ height: "16%", background: "var(--color-grid)" }}
            />
          ))}
          {samples.map((sample, i) => (
            <span
              key={sample.t}
              className="flex-1 rounded-full transition-all duration-300"
              title={`${formatRelative(sample.t, now)} · ${sample.score}%`}
              style={{
                height: `${16 + (sample.score / 100) * 84}%`,
                background: scoreColor(sample.score),
                opacity: i === samples.length - 1 ? 1 : 0.45,
              }}
            />
          ))}
        </div>
        <StatusBadge status={status} size="sm" />
      </div>
    </div>
  );
}

/** Compact ring for the header. */
export function MiniHealthRing({ score, size = 38 }: { score: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke - 2) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-grid)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
      />
    </svg>
  );
}
