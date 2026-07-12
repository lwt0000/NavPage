import {
  CircleCheck,
  CircleHelp,
  CloudOff,
  LockKeyhole,
  OctagonAlert,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ServiceStatus } from "@/lib/types";

export interface StatusMeta {
  icon: LucideIcon;
  text: string;
  bg: string;
  border: string;
  /** raw CSS color for dots / meters */
  dot: string;
  pulse?: boolean;
}

/**
 * Status is never communicated by color alone: every status renders an icon
 * plus its Chinese label (see StatusBadge), color is reinforcement only.
 */
export const STATUS_META: Record<ServiceStatus, StatusMeta> = {
  healthy: {
    icon: CircleCheck,
    text: "text-ok",
    bg: "bg-ok/10",
    border: "border-ok/25",
    dot: "var(--color-ok)",
  },
  degraded: {
    icon: TriangleAlert,
    text: "text-warn",
    bg: "bg-warn/10",
    border: "border-warn/25",
    dot: "var(--color-warn)",
    pulse: true,
  },
  critical: {
    icon: OctagonAlert,
    text: "text-crit",
    bg: "bg-crit/10",
    border: "border-crit/25",
    dot: "var(--color-crit)",
    pulse: true,
  },
  offline: {
    icon: CloudOff,
    text: "text-off",
    bg: "bg-off/10",
    border: "border-off/25",
    dot: "var(--color-off)",
  },
  maintenance: {
    icon: Wrench,
    text: "text-maint",
    bg: "bg-maint/10",
    border: "border-maint/25",
    dot: "var(--color-maint)",
  },
  "authentication-required": {
    icon: LockKeyhole,
    text: "text-auth",
    bg: "bg-auth/10",
    border: "border-auth/25",
    dot: "var(--color-auth)",
  },
  unknown: {
    icon: CircleHelp,
    text: "text-ink-3",
    bg: "bg-ink-3/10",
    border: "border-ink-3/25",
    dot: "var(--color-ink-3)",
  },
};

export function scoreColor(score: number): string {
  if (score >= 90) return "var(--color-ok)";
  if (score >= 70) return "var(--color-warn)";
  if (score >= 1) return "var(--color-crit)";
  return "var(--color-off)";
}
