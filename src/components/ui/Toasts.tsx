"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, Info, OctagonAlert, TriangleAlert, X } from "lucide-react";
import { useDashboard, type Toast } from "@/components/dashboard/DashboardProvider";
import { t } from "@/locales/zh-CN";

const META: Record<Toast["severity"], { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-maint" },
  success: { icon: CircleCheck, color: "text-ok" },
  warning: { icon: TriangleAlert, color: "text-warn" },
  critical: { icon: OctagonAlert, color: "text-crit" },
};

export function Toasts() {
  const { toasts, dismissToast } = useDashboard();
  return (
    <div
      className="fixed right-4 bottom-4 z-[70] flex w-[min(92vw,350px)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const meta = META[toast.severity];
          const Icon = meta.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 44, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="glass flex items-start gap-3 rounded-xl! p-3.5 pr-2.5"
            >
              <Icon size={17} className={`mt-0.5 shrink-0 ${meta.color}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{toast.title}</p>
                {toast.body && (
                  <p className="mt-0.5 text-xs leading-snug text-ink-2">{toast.body}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label={t.actions.close}
                className="rounded-md p-1 text-ink-3 transition-colors hover:text-ink"
              >
                <X size={14} aria-hidden />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
