"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, Info, OctagonAlert, TriangleAlert, X } from "lucide-react";
import { useDashboard, type Toast } from "@/components/dashboard/DashboardProvider";
import { t } from "@/locales/zh-CN";

const META: Record<
  Toast["severity"],
  { icon: typeof Info; color: string; line: string }
> = {
  info: { icon: Info, color: "text-maint", line: "var(--color-maint)" },
  success: { icon: CircleCheck, color: "text-ok", line: "var(--color-ok)" },
  warning: { icon: TriangleAlert, color: "text-warn", line: "var(--color-warn)" },
  critical: { icon: OctagonAlert, color: "text-crit", line: "var(--color-crit)" },
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
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 8, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="glass-4 relative flex items-start gap-3 overflow-hidden p-3.5 pr-2.5"
            >
              {/* narrow severity line */}
              <span
                className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full"
                style={{ background: meta.line }}
                aria-hidden
              />
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
