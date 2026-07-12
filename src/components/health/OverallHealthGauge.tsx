"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import type { ServiceStatus } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { StatusBadge } from "@/components/services/StatusBadge";
import { scoreColor } from "@/components/services/status-meta";

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
  size?: number;
}

/** Hero health ring — the one hero figure of the dashboard. */
export function OverallHealthGauge({ score, status, size = 176 }: GaugeProps) {
  const display = useAnimatedScore(score);
  const stroke = 11;
  const r = (size - stroke - 6) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  const offset = c * (1 - display / 100);

  return (
    <div
      className="relative flex flex-col items-center"
      role="img"
      aria-label={t.a11y.healthGauge(score)}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* unfilled track: a lighter step of the fill's own hue */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`color-mix(in oklab, ${color} 16%, transparent)`}
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
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 14px color-mix(in oklab, ${color} 45%, transparent))`,
            transition: "stroke 0.4s ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-baseline">
          <span className="text-5xl font-semibold leading-none tracking-tight">
            {display}
          </span>
          <span className="ml-0.5 text-lg font-medium text-ink-2">%</span>
        </div>
        <span className="text-xs text-ink-3">{t.header.overallHealth}</span>
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
        stroke={`color-mix(in oklab, ${color} 16%, transparent)`}
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
