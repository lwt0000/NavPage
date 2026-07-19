"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from "framer-motion";
import { X } from "lucide-react";
import { t } from "@/locales/zh-CN";
import { project, spring } from "@/lib/motion";
import { useLockBodyScroll } from "./useLockBodyScroll";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

/** Below the sm breakpoint the dialog presents as a draggable bottom sheet. */
function useIsSheet() {
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setSheet(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return sheet;
}

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isSheet = useIsSheet();
  const dragControls = useDragControls();
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

  // Commit or cancel from where the flick was *heading*, not where it ended:
  // project the release velocity and dismiss if the sheet would decelerate
  // past its midpoint.
  const onSheetDragEnd = (_: unknown, info: PanInfo) => {
    const height = panelRef.current?.offsetHeight ?? 480;
    if (info.offset.y + project(info.velocity.y) > height * 0.45) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center max-sm:p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-scrim backdrop-blur-md"
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
            className={`glass-3 relative flex w-full flex-col outline-none ${
              wide ? "sm:max-w-2xl" : "sm:max-w-md"
            } max-h-[86dvh] max-sm:rounded-b-none max-sm:rounded-t-xl max-sm:border-x-0 max-sm:border-b-0`}
            {...(isSheet
              ? {
                  initial: { y: "100%" },
                  animate: { y: 0 },
                  exit: { y: "100%" },
                  transition: spring,
                  drag: "y" as const,
                  dragListener: false,
                  dragControls,
                  dragConstraints: { top: 0, bottom: 0 },
                  // 1:1 toward dismissal, rubber-band against the top edge
                  dragElastic: { top: 0.08, bottom: 1 },
                  dragTransition: { bounceStiffness: 400, bounceDamping: 38 },
                  onDragEnd: onSheetDragEnd,
                }
              : {
                  initial: { opacity: 0, scale: 0.96, y: 12, filter: "blur(6px)" },
                  animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
                  exit: { opacity: 0, scale: 0.96, y: 12, filter: "blur(6px)" },
                  transition: spring,
                })}
          >
            {/* header doubles as the sheet's drag surface */}
            <div
              className={`shrink-0 px-5 sm:px-6 ${isSheet ? "touch-none" : ""}`}
              onPointerDown={isSheet ? (e) => dragControls.start(e) : undefined}
            >
              {isSheet && <div className="sheet-grabber mt-2.5" aria-hidden />}
              <div className="flex items-center justify-between gap-4 pb-4 pt-4">
                <h2 className="text-base font-semibold">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.actions.close}
                  className="icon-action rounded-lg p-1.5 text-ink-2 hover:bg-ink/5 hover:text-ink"
                >
                  <X size={17} aria-hidden />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
