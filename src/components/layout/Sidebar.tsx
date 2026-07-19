"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { RefreshIndicator } from "@/components/ui/RefreshIndicator";
import { useLockBodyScroll } from "@/components/ui/useLockBodyScroll";
import { project, spring } from "@/lib/motion";
import { t } from "@/locales/zh-CN";
import { useCategories } from "./useCategories";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { category, setCategory, settings } = useDashboard();
  const categories = useCategories();

  const intervalLabel =
    settings.refreshIntervalSeconds == null
      ? t.metrics.manualOnly
      : settings.refreshIntervalSeconds < 60
        ? t.time.everySeconds(settings.refreshIntervalSeconds)
        : t.time.everyMinutes(settings.refreshIntervalSeconds / 60);

  return (
    <div className="flex h-full flex-col">
      <nav aria-label={t.categories.all} className="flex-1 space-y-1 overflow-y-auto p-3">
        {categories.map(({ key, label, icon: Icon, count }) => {
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setCategory(key);
                onNavigate?.();
              }}
              aria-current={active ? "page" : undefined}
              data-active={active}
              className={`nav-item group relative flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${
                active
                  ? ""
                  : "text-ink-2 hover:bg-soft hover:text-ink"
              }`}
            >
              <Icon
                size={16}
                aria-hidden
                className={active ? "" : "text-ink-3 transition-colors group-hover:text-ink-2"}
              />
              <span className="flex-1 truncate font-medium">{label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
                  active ? "bg-white/25 text-white" : "bg-ink/6 text-ink-3"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        <RefreshIndicator />
        <p className="mt-1.5 pl-8 text-[11px] text-ink-3">
          {t.metrics.autoRefresh} · {intervalLabel}
        </p>
      </div>
    </div>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  useLockBodyScroll(mobileOpen);

  // dismiss when the projected resting point is well past the edge — a flick
  // toward the edge closes even from a small offset, a reverse flick cancels
  const onDrawerDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x + project(info.velocity.x) < -96) onClose();
  };

  return (
    <>
      {/* desktop rail */}
      <aside className="sticky top-[4.75rem] hidden h-[calc(100dvh-5.75rem)] w-60 shrink-0 lg:block">
        <div className="glass nav-panel h-full overflow-hidden">
          <SidebarContent />
        </div>
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden
            />
            <motion.aside
              className="glass-3 drag-x-surface fixed inset-y-3 left-3 z-50 flex w-[17rem] flex-col overflow-hidden lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t.categories.all}
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={spring}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              // 1:1 back toward the edge it came from, rubber-band to the right
              dragElastic={{ left: 1, right: 0.06 }}
              dragTransition={{ bounceStiffness: 400, bounceDamping: 38 }}
              onDragEnd={onDrawerDragEnd}
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="text-sm font-semibold">{t.app.title}</span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.header.closeMenu}
                  className="icon-action rounded-lg p-1.5 text-ink-2 hover:bg-ink/5 hover:text-ink"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
