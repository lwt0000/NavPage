"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Menu, Search, Settings } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { MiniHealthRing } from "@/components/health/OverallHealthGauge";
import { STATUS_META } from "@/components/services/status-meta";
import { t } from "@/locales/zh-CN";
import {
  formatClockTime,
  formatFullDate,
  formatRelative,
  formatWeekday,
} from "@/lib/format";
import { useNow } from "@/components/ui/useNow";

function Logo() {
  return (
    <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/90 via-indigo-400/80 to-teal-300/80 shadow-[0_6px_20px_rgba(91,103,240,0.35)]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 7l3.2 10L12 8.5 16.8 17 20 7"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) {
    return (
      <div className="hidden text-right md:block" aria-hidden>
        <div className="text-sm font-medium tabular-nums text-ink-2">--:--</div>
      </div>
    );
  }
  return (
    <div className="hidden text-right leading-tight md:block">
      <div className="text-sm font-medium tabular-nums" suppressHydrationWarning>
        {formatClockTime(now)}
      </div>
      <div className="text-[11px] text-ink-3" suppressHydrationWarning>
        {formatFullDate(now)} · {formatWeekday(now)}
      </div>
    </div>
  );
}

const HEADER_STATUS_TEXT: Record<string, string> = {
  healthy: t.header.statusAllOk,
  degraded: t.header.statusDegraded,
  critical: t.header.statusCritical,
  offline: t.header.statusOffline,
  maintenance: t.header.statusMaintenance,
  unknown: t.header.statusUnknown,
  "authentication-required": t.header.statusAllOk,
};

function Notifications() {
  const { snapshot } = useDashboard();
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>(() => new Date(0).toISOString());
  const ref = useRef<HTMLDivElement>(null);
  const now = useNow(15_000);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wcc:notify-seen");
      if (stored) setLastSeen(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activity = snapshot?.activity ?? [];
  const unread = activity.filter((e) => e.t > lastSeen).length;

  const markRead = () => {
    const stamp = new Date().toISOString();
    setLastSeen(stamp);
    try {
      localStorage.setItem("wcc:notify-seen", stamp);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markRead();
        }}
        aria-label={t.header.notifications}
        aria-expanded={open}
        className="relative rounded-xl border border-white/70 bg-white/45 p-2.5 text-ink-2 shadow-sm transition-colors hover:bg-white/85 hover:text-ink"
      >
        <Bell size={16} aria-hidden />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-crit text-[9px] font-bold text-white"
            aria-label={t.a11y.unreadCount(unread)}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass absolute right-0 top-12 z-50 w-80 bg-white/80 p-2"
          >
            <div className="px-3 py-2 text-xs font-medium text-ink-3">
              {t.header.notifications}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {activity.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-3">
                  {t.header.noNotifications}
                </p>
              ) : (
                activity.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-ink/4"
                  >
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{
                        background:
                          event.severity === "critical"
                            ? "var(--color-crit)"
                            : event.severity === "warning"
                              ? "var(--color-warn)"
                              : event.severity === "success"
                                ? "var(--color-ok)"
                                : "var(--color-maint)",
                      }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {event.serviceName ?? t.app.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-ink-2">
                        {event.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-3">
                        {formatRelative(event.t, now)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { snapshot, setPaletteOpen, setSettingsOpen } = useDashboard();
  const overall = snapshot?.overall ?? null;
  const status = overall?.status ?? "unknown";
  const StatusIcon = STATUS_META[status].icon;

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/55 shadow-[0_1px_12px_rgba(35,50,95,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1720px] items-center gap-3 px-4 sm:gap-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t.header.openMenu}
          className="rounded-xl border border-white/70 bg-white/45 p-2.5 text-ink-2 shadow-sm transition-colors hover:text-ink lg:hidden"
        >
          <Menu size={16} aria-hidden />
        </button>

        <Logo />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-[15px] font-semibold tracking-wide">
            {t.app.title}
          </h1>
          <p className="hidden truncate text-[11px] text-ink-3 md:block">
            {t.app.subtitle}
          </p>
        </div>

        {/* global status pill */}
        {overall && (
          <div className="ml-2 hidden items-center gap-2.5 rounded-full border border-white/70 bg-white/45 py-1.5 pl-3 pr-4 shadow-sm xl:flex">
            <StatusIcon
              size={14}
              className={STATUS_META[status].text}
              aria-hidden
            />
            <span className="text-xs font-medium">
              {HEADER_STATUS_TEXT[status]}
            </span>
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <span className="text-xs text-ink-2">
              <span className="font-semibold text-ok">{overall.online}</span>{" "}
              {t.header.onlineShort} ·{" "}
              <span className="font-semibold text-warn">{overall.degraded}</span>{" "}
              {t.header.degradedShort} ·{" "}
              <span className="font-semibold text-off">{overall.offline}</span>{" "}
              {t.header.offlineShort}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* compact health ring */}
        {overall && (
          <a
            href="#health-overview"
            className="hidden items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-ink/4 sm:flex"
            aria-label={t.a11y.healthGauge(overall.score)}
          >
            <MiniHealthRing score={overall.score} />
            <div className="leading-tight">
              <div className="text-sm font-semibold">{overall.score}%</div>
              <div className="text-[10px] text-ink-3">{t.header.overallHealth}</div>
            </div>
          </a>
        )}

        <Clock />

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/45 px-3 py-2.5 text-sm text-ink-3 shadow-sm transition-colors hover:bg-white/85 hover:text-ink-2"
          aria-label={t.actions.search}
        >
          <Search size={15} aria-hidden />
          <span className="hidden md:inline">{t.actions.search}</span>
          <kbd className="hidden rounded-md border border-line bg-white/60 px-1.5 py-0.5 font-sans text-[10px] text-ink-3 md:inline">
            Ctrl K
          </kbd>
        </button>

        <Notifications />

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={t.header.settings}
          className="rounded-xl border border-white/70 bg-white/45 p-2.5 text-ink-2 shadow-sm transition-colors hover:bg-white/85 hover:text-ink"
        >
          <Settings size={16} aria-hidden />
        </button>

        <div className="hidden items-center gap-2.5 border-l border-line pl-3 lg:flex">
          <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500/70 to-teal-400/60 text-xs font-semibold text-white">
            {t.app.user.slice(0, 1)}
          </div>
          <div className="leading-tight">
            <div className="text-xs font-medium">{t.app.user}</div>
            <div className="text-[10px] text-ink-3">{t.app.userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
