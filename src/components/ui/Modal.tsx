"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { t } from "@/locales/zh-CN";
import { useLockBodyScroll } from "./useLockBodyScroll";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink/25 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`glass relative w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[86dvh] overflow-y-auto p-5 sm:p-6 outline-none`}
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold tracking-wide">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.actions.close}
                className="rounded-lg p-1.5 text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <X size={17} aria-hidden />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
