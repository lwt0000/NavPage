"use client";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  accent?: string;
}

/** 12-point stat-tile trend: de-emphasized line, current period accented. */
export function Sparkline({
  values,
  width = 92,
  height = 26,
  stroke = "var(--color-ink-3)",
  accent = "var(--color-chart-1)",
}: SparklineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 6) + 3,
    height - 4 - ((v - min) / span) * (height - 8),
  ]);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={2.8}
        fill={accent}
        stroke="var(--color-surface)"
        strokeWidth={1.5}
      />
    </svg>
  );
}
