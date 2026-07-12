"use client";

import { RefreshCw } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { t } from "@/locales/zh-CN";
import { formatRelative } from "@/lib/format";
import { useNow } from "./useNow";

/** "正在刷新 / 最后更新 x 前" line with a manual refresh control. */
export function RefreshIndicator({ compact }: { compact?: boolean }) {
  const { snapshot, refreshing, refreshAll } = useDashboard();
  const now = useNow(10_000);
  const last = snapshot?.overall.lastFullRefreshAt ?? null;

  return (
    <div className="flex items-center gap-2 text-xs text-ink-3">
      <button
        type="button"
        onClick={() => void refreshAll()}
        disabled={refreshing}
        aria-label={t.actions.refreshAll}
        className="rounded-lg p-1.5 text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-60"
      >
        <RefreshCw size={14} className={refreshing ? "spin-slow" : undefined} aria-hidden />
      </button>
      {/* reserved width so the label change doesn't shift neighboring buttons */}
      <span aria-live="polite" className="inline-block min-w-[5em]">
        {refreshing
          ? `${t.metrics.refreshing}……`
          : compact
            ? formatRelative(last, now)
            : `${t.metrics.lastUpdated} ${formatRelative(last, now)}`}
      </span>
    </div>
  );
}
