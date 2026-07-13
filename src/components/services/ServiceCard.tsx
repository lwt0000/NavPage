"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  EllipsisVertical,
  ExternalLink,
  GripVertical,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  Wrench,
} from "lucide-react";
import type { DashboardService } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { formatLatency, formatPercent, formatRelative } from "@/lib/format";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { useNow } from "@/components/ui/useNow";
import { getServiceIcon } from "./service-icons";
import { scoreColor } from "./status-meta";
import { StatusBadge } from "./StatusBadge";

interface ServiceCardProps {
  service: DashboardService;
  onRequestDelete: (service: DashboardService) => void;
}

function CardMenu({
  service,
  onRequestDelete,
  onOpenChange,
}: ServiceCardProps & { onOpenChange: (open: boolean) => void }) {
  const { openEditor, checkOne, patchService, pushToast } = useDashboard();
  const [open, setOpenState] = useState(false);
  // opens upward when there is not enough room below
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const setOpen = (next: boolean) => {
    if (next && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 300 && rect.top > 300);
    }
    setOpenState(next);
    onOpenChange(next);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: globalThis.MouseEvent) => {
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

  const maintenance = service.status === "maintenance";

  const items: Array<{
    key: string;
    label: string;
    icon: typeof Pencil;
    danger?: boolean;
    action: () => void;
  }> = [
    {
      key: "edit",
      label: t.actions.editService,
      icon: Pencil,
      action: () => openEditor(service),
    },
    {
      key: "check",
      label: t.actions.checkNow,
      icon: RefreshCw,
      action: () => void checkOne(service.id),
    },
    {
      key: "copy",
      label: t.actions.copyUrl,
      icon: Copy,
      action: () => {
        void navigator.clipboard
          .writeText(service.navigationUrl)
          .then(() => pushToast({ severity: "info", title: t.toasts.urlCopied }));
      },
    },
    {
      key: "maintenance",
      label: maintenance ? t.actions.exitMaintenance : t.actions.enterMaintenance,
      icon: Wrench,
      action: () =>
        void patchService(service.id, {
          status: maintenance ? "unknown" : "maintenance",
        }),
    },
    {
      key: "monitoring",
      label: service.monitoringEnabled
        ? t.actions.pauseMonitoring
        : t.actions.resumeMonitoring,
      icon: service.monitoringEnabled ? Pause : Play,
      action: () =>
        void patchService(service.id, {
          monitoringEnabled: !service.monitoringEnabled,
        }),
    },
    {
      key: "delete",
      label: t.actions.deleteService,
      icon: Trash2,
      danger: true,
      action: () => onRequestDelete(service),
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t.actions.more}
        aria-expanded={open}
        className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-ink/8 hover:text-ink"
      >
        <EllipsisVertical size={15} aria-hidden />
      </button>
      {open && (
        <div
          className={`glass-3 absolute right-0 z-50 w-44 p-1.5 ${dropUp ? "bottom-9" : "top-9"}`}
        >
          {items.map(({ key, label, icon: Icon, danger, action }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setOpen(false);
                action();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                danger
                  ? "text-crit hover:bg-crit/10"
                  : "text-ink-2 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <Icon size={13.5} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  title,
  children,
}: {
  label: string;
  value: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0" title={title}>
      <div className="text-[10px] text-ink-3">{label}</div>
      <div className="mt-0.5 truncate text-[13px] font-semibold tabular-nums">
        {value}
      </div>
      {children}
    </div>
  );
}

export function ServiceCard({ service, onRequestDelete }: ServiceCardProps) {
  const { editMode, toggleFavorite, openService } = useDashboard();
  const now = useNow(10_000);
  const Icon = getServiceIcon(service.icon);
  // while the ⋮ menu is open the whole card must rise above its siblings —
  // the hover transform creates a stacking context that would otherwise let
  // later cards in the grid paint over the dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id, disabled: !editMode });

  const onPointerGlow = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 30 : menuOpen ? 40 : undefined,
      }}
      className={`relative ${isDragging ? "opacity-90" : ""}`}
    >
      <motion.article
        layout={!editMode}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={editMode ? undefined : { y: -5 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onMouseMove={onPointerGlow}
        aria-label={t.a11y.serviceCard(service.name, t.status[service.status])}
        className={`glass card-glass spot group/card flex h-full flex-col gap-3.5 p-5 ${
          isDragging ? "ring-2 ring-accent/50" : ""
        } ${!service.monitoringEnabled ? "opacity-75" : ""}`}
      >
        {/* header */}
        <div className="flex items-start gap-3">
          {editMode && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={t.a11y.dragHandle(service.name)}
              className="mt-2 cursor-grab touch-none rounded-md p-1 text-ink-3 hover:text-ink active:cursor-grabbing"
            >
              <GripVertical size={15} aria-hidden />
            </button>
          )}
          <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-line-strong bg-soft text-ink-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200 group-hover/card:text-ink">
            <Icon size={20} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold leading-tight">
              {service.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-ink-3">{service.displayUrl}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(service)}
            aria-label={t.a11y.toggleFavorite(service.name)}
            aria-pressed={service.favorite}
            className={`rounded-lg p-1.5 transition-all hover:scale-110 ${
              service.favorite ? "text-warn" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <Star size={15} fill={service.favorite ? "currentColor" : "none"} aria-hidden />
          </button>
          <CardMenu
            service={service}
            onRequestDelete={onRequestDelete}
            onOpenChange={setMenuOpen}
          />
        </div>

        {/* description */}
        <p className="line-clamp-2 min-h-10 text-[13px] leading-relaxed text-ink-2">
          {service.description}
        </p>

        {/* badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={service.status} size="sm" />
          {service.routeLabel && (
            <span className="rounded-full border border-line bg-soft px-2 py-0.5 text-[11px] text-ink-2">
              {service.routeLabel}
            </span>
          )}
          {service.admin && (
            <span className="inline-flex items-center gap-1 rounded-full border border-auth/30 bg-auth/10 px-2 py-0.5 text-[11px] font-medium text-auth">
              <ShieldCheck size={11} aria-hidden />
              {t.metrics.adminBadge}
            </span>
          )}
          <span className="rounded-full border border-line bg-soft px-2 py-0.5 text-[11px] text-ink-3">
            {t.categories[service.category]}
          </span>
          {!service.monitoringEnabled && (
            <span className="rounded-full border border-line bg-soft px-2 py-0.5 text-[11px] text-ink-3">
              {t.metrics.monitoringPaused}
            </span>
          )}
        </div>

        {/* metrics */}
        <div className="well grid grid-cols-3 gap-3 px-3.5 py-3">
          <Metric
            label={t.metrics.healthScore}
            value={service.status === "unknown" ? "—" : `${service.healthScore}%`}
            title={`${t.metrics.healthScore} ${service.healthScore}%`}
          >
            <div
              className="mt-1.5 h-1 overflow-hidden rounded-full"
              style={{
                background: `color-mix(in oklab, ${scoreColor(service.healthScore)} 15%, transparent)`,
              }}
              aria-hidden
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${service.status === "unknown" ? 0 : service.healthScore}%`,
                  background: scoreColor(service.healthScore),
                }}
              />
            </div>
          </Metric>
          <Metric
            label={t.metrics.latency}
            value={
              service.status === "offline"
                ? t.metrics.timeout
                : formatLatency(service.latencyMs)
            }
            title={`${t.metrics.latency}：${formatLatency(service.latencyMs)}`}
          />
          <Metric
            label={t.metrics.uptime}
            value={formatPercent(service.uptimePercentage, 2)}
            title={`${t.metrics.uptime} ${formatPercent(service.uptimePercentage, 2)}`}
          />
        </div>

        {/* footer */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => openService(service)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-accent/35 bg-accent-soft px-3.5 py-2 text-xs font-medium text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-accent/55 hover:bg-accent/25 hover:shadow-[0_4px_20px_var(--color-accent-glow),inset_0_1px_0_rgba(255,255,255,0.12)]"
          >
            {t.actions.open}
            <ExternalLink
              size={12}
              className="transition-transform duration-200 group-hover/card:translate-x-0.5"
              aria-hidden
            />
          </button>
          <span className="text-[11px] text-ink-3">
            {t.metrics.lastChecked}{" "}
            {service.lastCheckedAt
              ? formatRelative(service.lastCheckedAt, now)
              : t.metrics.notCheckedYet}
          </span>
        </div>
      </motion.article>
    </div>
  );
}
