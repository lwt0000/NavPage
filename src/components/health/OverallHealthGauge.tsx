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

const SEGMENTS = 44;
/* 270° instrument arc, opening at the bottom */
const START_ANGLE = 135;
const SWEEP = 270;

/** Segmented radial instrument — the one hero figure of the dashboard. */
export function OverallHealthGauge({ score, status, size = 184 }: GaugeProps) {
  const display = useAnimatedScore(score);
  const color = scoreColor(score);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 5;
  const rInner = rOuter - 11;
  const lit = Math.round((display / 100) * SEGMENTS);

  const ticks = Array.from({ length: SEGMENTS }, (_, i) => {
    const angle = START_ANGLE + (i / (SEGMENTS - 1)) * SWEEP;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x1: cx + rInner * cos,
      y1: cy + rInner * sin,
      x2: cx + rOuter * cos,
      y2: cy + rOuter * sin,
      on: i < lit,
    };
  });

  return (
    <div
      className="relative flex flex-col items-center"
      role="img"
      aria-label={t.a11y.healthGauge(score)}
    >
      <svg width={size} height={size}>
        {/* soft center glow */}
        <circle
          cx={cx}
          cy={cy}
          r={rInner - 14}
          fill={color}
          opacity={0.09}
          style={{ filter: "blur(18px)", transition: "fill 0.4s ease" }}
        />
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.on ? color : "var(--color-grid)"}
            strokeWidth={3}
            strokeLinecap="round"
            style={{
              transition: "stroke 0.3s ease",
              filter: tick.on
                ? `drop-shadow(0 0 4px color-mix(in oklab, ${color} 55%, transparent))`
                : undefined,
            }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-baseline">
          <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums">
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
