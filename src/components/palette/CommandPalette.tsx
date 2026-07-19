"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Clock3,
  CornerDownLeft,
  FileDown,
  LayoutGrid,
  LayoutList,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Star,
  Stethoscope,
  SunMoon,
  type LucideIcon,
} from "lucide-react";
import type { CategoryKey } from "@/lib/types";
import { springSnappy } from "@/lib/motion";
import { t } from "@/locales/zh-CN";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { useCategories } from "@/components/layout/useCategories";
import { getServiceIcon } from "@/components/services/service-icons";
import { StatusBadge } from "@/components/services/StatusBadge";
import { useLockBodyScroll } from "@/components/ui/useLockBodyScroll";

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  trailing?: React.ReactNode;
  perform: () => void;
}

const GROUP_LABELS: Record<string, string> = {
  recent: t.palette.recentGroup,
  services: t.palette.servicesGroup,
  actions: t.palette.actionsGroup,
  categories: t.palette.categoriesGroup,
};

export function CommandPalette() {
  const {
    paletteOpen,
    setPaletteOpen,
    snapshot,
    recentIds,
    openService,
    refreshAll,
    openAllFavorites,
    openEditor,
    editMode,
    setEditMode,
    setSettingsOpen,
    exportReport,
    setCategory,
    settings,
    updateSettings,
  } = useDashboard();
  const categories = useCategories();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll(paletteOpen);

  const close = () => {
    setPaletteOpen(false);
    setQuery("");
    setActive(0);
  };

  useEffect(() => {
    if (paletteOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
  }, [paletteOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const services = snapshot?.services ?? [];
    const q = query.trim().toLowerCase();

    const serviceItems: PaletteItem[] = services
      .filter(
        (s) =>
          q === "" ||
          s.name.toLowerCase().includes(q) ||
          s.displayUrl.toLowerCase().includes(q) ||
          s.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.categories[s.category].toLowerCase().includes(q),
      )
      .map((s) => ({
        id: `service-${s.id}`,
        group: "services",
        label: t.palette.openService(s.name),
        sub: s.displayUrl,
        icon: getServiceIcon(s.icon),
        trailing: <StatusBadge status={s.status} size="sm" />,
        perform: () => openService(s),
      }));

    const scrollToComparison = () =>
      document
        .getElementById("route-comparison")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });

    const actionDefs: Array<{ label: string; icon: LucideIcon; run: () => void }> = [
      { label: t.actions.refreshAll, icon: RefreshCw, run: () => void refreshAll() },
      { label: t.actions.runFullCheck, icon: Stethoscope, run: () => void refreshAll() },
      { label: t.actions.compareEmby, icon: ArrowLeftRight, run: scrollToComparison },
      { label: t.actions.openAllFavorites, icon: Star, run: openAllFavorites },
      { label: t.actions.addService, icon: Plus, run: () => openEditor(null) },
      {
        label: editMode ? t.actions.exitEditMode : t.actions.enterEditMode,
        icon: LayoutList,
        run: () => setEditMode(!editMode),
      },
      { label: t.actions.exportReport, icon: FileDown, run: exportReport },
      {
        label: t.actions.toggleTheme,
        icon: SunMoon,
        run: () =>
          updateSettings({ theme: settings.theme === "light" ? "dark" : "light" }),
      },
      { label: t.actions.openSettings, icon: Settings, run: () => setSettingsOpen(true) },
    ];

    const actionItems: PaletteItem[] = actionDefs
      .filter((a) => q === "" || a.label.toLowerCase().includes(q))
      .map((a, i) => ({
        id: `action-${i}`,
        group: "actions",
        label: a.label,
        icon: a.icon,
        perform: a.run,
      }));

    const categoryItems: PaletteItem[] = categories
      .filter((c) => q !== "" && c.label.toLowerCase().includes(q))
      .map((c) => ({
        id: `category-${c.key}`,
        group: "categories",
        label: c.label,
        sub: `${c.count}`,
        icon: LayoutGrid,
        perform: () => setCategory(c.key as CategoryKey),
      }));

    const recentItems: PaletteItem[] =
      q === ""
        ? recentIds
            .map((id) => services.find((s) => s.id === id))
            .filter((s): s is NonNullable<typeof s> => Boolean(s))
            .slice(0, 4)
            .map((s) => ({
              id: `recent-${s.id}`,
              group: "recent",
              label: t.palette.openService(s.name),
              sub: s.displayUrl,
              icon: Clock3,
              perform: () => openService(s),
            }))
        : [];

    return [...recentItems, ...serviceItems, ...actionItems, ...categoryItems];
  }, [
    snapshot, query, recentIds, categories, editMode,
    openService, refreshAll, openAllFavorites, openEditor,
    setEditMode, setSettingsOpen, exportReport, setCategory,
    settings.theme, updateSettings,
  ]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item) {
        close();
        item.perform();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[60] overflow-y-auto bg-scrim p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            className="glass-3 mx-auto mt-[10vh] w-full max-w-xl overflow-hidden p-0!"
            initial={{ opacity: 0, y: -14, scale: 0.97, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, scale: 0.97, filter: "blur(6px)" }}
            transition={springSnappy}
            style={{ transformOrigin: "top center" }}
            role="dialog"
            aria-modal="true"
            aria-label={t.actions.search}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={16} className="shrink-0 text-ink-3" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.palette.placeholder}
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={items[active] ? `palette-item-${active}` : undefined}
                className="h-13 w-full bg-transparent py-4 text-sm text-ink outline-none placeholder:text-ink-3"
              />
              <kbd className="shrink-0 rounded-md border border-line bg-soft px-1.5 py-0.5 text-[10px] text-ink-3">
                Esc
              </kbd>
            </div>

            <div
              ref={listRef}
              id="palette-list"
              role="listbox"
              className="max-h-[46vh] overflow-y-auto overscroll-contain p-2"
            >
              {items.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-ink-3">
                  {t.palette.noResults}
                </p>
              ) : (
                items.map((item, index) => {
                  const showHeader = item.group !== lastGroup;
                  lastGroup = item.group;
                  const Icon = item.icon;
                  const isActive = index === active;
                  return (
                    <div key={item.id}>
                      {showHeader && (
                        <div className="px-3 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-wider text-ink-3">
                          {GROUP_LABELS[item.group]}
                        </div>
                      )}
                      <button
                        type="button"
                        id={`palette-item-${index}`}
                        data-index={index}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => {
                          close();
                          item.perform();
                        }}
                        className={`pressable flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${
                          isActive ? "bg-accent-soft" : "hover:bg-ink/4"
                        }`}
                      >
                        <Icon
                          size={15}
                          className={isActive ? "text-accent" : "text-ink-3"}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{item.label}</span>
                          {item.sub && (
                            <span className="block truncate text-[11px] text-ink-3">
                              {item.sub}
                            </span>
                          )}
                        </span>
                        {item.trailing}
                        {isActive && (
                          <CornerDownLeft size={13} className="shrink-0 text-ink-3" aria-hidden />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[10px] text-ink-3">
              <span>{t.palette.hintNavigate}</span>
              <span>{t.palette.hintOpen}</span>
              <span>{t.palette.hintClose}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
