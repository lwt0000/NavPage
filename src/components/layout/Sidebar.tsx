"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { RefreshIndicator } from "@/components/ui/RefreshIndicator";
import { useLockBodyScroll } from "@/components/ui/useLockBodyScroll";
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
              className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                active
                  ? "border-accent/35 bg-accent-soft text-ink shadow-[0_4px_16px_rgba(91,103,240,0.15)]"
                  : "border-transparent text-ink-2 hover:border-white/70 hover:bg-white/55 hover:text-ink"
              }`}
            >
              <Icon
                size={16}
                aria-hidden
                className={active ? "text-accent" : "text-ink-3 transition-colors group-hover:text-ink-2"}
              />
              <span className="flex-1 truncate font-medium">{label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
                  active ? "bg-accent/20 text-ink" : "bg-ink/6 text-ink-3"
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
  return (
    <>
      {/* desktop rail */}
      <aside className="sticky top-[4.75rem] hidden h-[calc(100dvh-5.75rem)] w-60 shrink-0 lg:block">
        <div className="glass h-full overflow-hidden">
          <SidebarContent />
        </div>
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden
            />
            <motion.aside
              className="glass fixed inset-y-3 left-3 z-50 w-[17rem] overflow-hidden lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t.categories.all}
              initial={{ x: -320, opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0.6 }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="text-sm font-semibold">{t.app.title}</span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.header.closeMenu}
                  className="rounded-lg p-1.5 text-ink-2 hover:bg-ink/5 hover:text-ink"
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
