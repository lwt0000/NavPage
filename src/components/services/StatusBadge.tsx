"use client";

import type { ServiceStatus } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { STATUS_META } from "./status-meta";

interface StatusBadgeProps {
  status: ServiceStatus;
  size?: "sm" | "md";
}

/** Icon + Chinese label pill — status is never conveyed by color alone. */
export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium ${meta.bg} ${meta.border} ${meta.text} ${
        size === "sm" ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-xs"
      }`}
    >
      <Icon
        size={size === "sm" ? 12 : 13}
        className={meta.pulse ? "pulse-soft" : undefined}
        aria-hidden
      />
      {t.status[status]}
    </span>
  );
}
