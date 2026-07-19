"use client";

import { useState } from "react";
import { Activity as ActivityIcon, ChevronDown } from "lucide-react";
import type { ActivitySeverity } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { formatRelative } from "@/lib/format";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { useNow } from "@/components/ui/useNow";
import { STATUS_META } from "@/components/services/status-meta";

const SEVERITY_COLOR: Record<ActivitySeverity, string> = {
  info: "var(--color-maint)",
  success: "var(--color-ok)",
  warning: "var(--color-warn)",
  critical: "var(--color-crit)",
};

export function ActivityTimeline() {
  const { snapshot } = useDashboard();
  const now = useNow(15_000);
  const [expanded, setExpanded] = useState(false);

  const incidents = snapshot?.incidents ?? [];
  const activity = snapshot?.activity ?? [];
  const visible = activity.slice(0, expanded ? 30 : 10);

  return (
    <section aria-label={t.activityFeed.title} className="glass module-panel p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="module-icon grid size-9 place-items-center text-ink-2">
          <ActivityIcon size={16} aria-hidden />
        </div>
        <h2 className="text-sm font-semibold">
          {t.activityFeed.title}
        </h2>
        {incidents.length > 0 && (
          <span className="ml-auto rounded-full border border-crit/30 bg-crit/10 px-2.5 py-1 text-[11px] font-medium text-crit">
            {t.metrics.activeIncidents} {incidents.length}
          </span>
        )}
      </div>

      {/* active incidents */}
      {incidents.length > 0 && (
        <div className="mb-4 space-y-2">
          {incidents.map((incident) => {
            const meta = STATUS_META[incident.status];
            const Icon = meta.icon;
            return (
              <div
                key={incident.id}
                className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${meta.border} ${meta.bg}`}
              >
                <Icon size={14} className={`mt-0.5 shrink-0 ${meta.text} ${meta.pulse ? "pulse-soft" : ""}`} aria-hidden />
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{incident.serviceName}</span>
                    <span className="shrink-0 text-[10px] text-ink-3">
                      {t.activityFeed.ongoingSince(formatRelative(incident.startedAt, now))}
                    </span>
                  </div>
                  <p className="mt-0.5 text-ink-2">{incident.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* timeline */}
      {visible.length === 0 ? (
        <p className="py-6 text-center text-xs text-ink-3">{t.activityFeed.empty}</p>
      ) : (
        <ol className="relative space-y-0.5 border-l border-line pl-4">
          {visible.map((event) => (
            <li key={event.id} className="relative rounded-lg py-2 pl-1 pr-1 transition-colors hover:bg-ink/4">
              <span
                className="absolute -left-[21px] top-3.5 size-2 rounded-full border-2 border-surface"
                style={{ background: SEVERITY_COLOR[event.severity] }}
                aria-hidden
              />
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-medium">
                  {event.serviceName ?? t.app.title}
                </span>
                <span className="shrink-0 text-[10px] text-ink-3">
                  {formatRelative(event.t, now)}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-ink-2">
                <span className="sr-only">{t.severity[event.severity]}：</span>
                {event.message}
              </p>
            </li>
          ))}
        </ol>
      )}

      {activity.length > 10 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-line bg-soft py-2 text-[11px] font-medium text-ink-3 transition-colors hover:border-line-strong hover:bg-soft-2 hover:text-ink-2"
        >
          {t.activityFeed.showMore}
          <ChevronDown
            size={12}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      )}
    </section>
  );
}
