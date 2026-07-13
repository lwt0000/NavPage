"use client";

import {
  ArrowLeftRight,
  FileDown,
  FolderCog,
  LayoutList,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Stethoscope,
  Zap,
} from "lucide-react";
import { t } from "@/locales/zh-CN";
import { useDashboard } from "@/components/dashboard/DashboardProvider";

export function QuickActions() {
  const {
    refreshAll,
    refreshing,
    openAllFavorites,
    openEditor,
    editMode,
    setEditMode,
    exportReport,
    setSettingsOpen,
  } = useDashboard();

  const scrollToComparison = () => {
    document
      .getElementById("route-comparison")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const actions = [
    {
      key: "refresh",
      label: t.actions.refreshAll,
      icon: RefreshCw,
      onClick: () => void refreshAll(),
      spinning: refreshing,
    },
    {
      key: "full-check",
      label: t.actions.runFullCheck,
      icon: Stethoscope,
      onClick: () => void refreshAll(),
    },
    {
      key: "favorites",
      label: t.actions.openAllFavorites,
      icon: Star,
      onClick: openAllFavorites,
    },
    {
      key: "compare",
      label: t.actions.compareEmby,
      icon: ArrowLeftRight,
      onClick: scrollToComparison,
    },
    {
      key: "add",
      label: t.actions.addService,
      icon: Plus,
      onClick: () => openEditor(null),
    },
    {
      key: "edit-mode",
      label: editMode ? t.actions.exitEditMode : t.actions.enterEditMode,
      icon: LayoutList,
      onClick: () => setEditMode(!editMode),
      active: editMode,
    },
    {
      key: "export",
      label: t.actions.exportReport,
      icon: FileDown,
      onClick: exportReport,
    },
    {
      key: "categories",
      label: t.actions.manageCategories,
      icon: FolderCog,
      onClick: () => setSettingsOpen(true),
    },
    {
      key: "settings",
      label: t.actions.openSettings,
      icon: Settings,
      onClick: () => setSettingsOpen(true),
    },
  ];

  return (
    <section aria-label={t.actions.quickActions} className="glass module-panel p-5">
      <div className="mb-3.5 flex items-center gap-2.5">
        <div className="module-icon grid size-9 place-items-center text-ink-2">
          <Zap size={16} aria-hidden />
        </div>
        <h2 className="text-sm font-semibold tracking-wide">
          {t.actions.quickActions}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-2">
        {actions.map(({ key, label, icon: Icon, onClick, spinning, active }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className={`action-cell group flex items-center gap-2.5 border px-3 py-2.5 text-left text-xs font-medium transition-all duration-200 ${
              active
                ? "border-accent/40 bg-accent-soft text-ink"
                : "border-line bg-soft text-ink-2 hover:border-line-strong hover:bg-soft-2 hover:text-ink"
            }`}
          >
            <Icon
              size={14}
              className={`shrink-0 ${spinning ? "spin-slow" : ""} ${
                active ? "text-accent" : "text-ink-3 transition-colors group-hover:text-accent"
              }`}
              aria-hidden
            />
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
