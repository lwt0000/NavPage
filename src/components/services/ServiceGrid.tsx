"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CircleAlert, LayoutList, Plus, RefreshCw, SearchX } from "lucide-react";
import type { DashboardService } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { matchesCategory, useCategories } from "@/components/layout/useCategories";
import { Modal } from "@/components/ui/Modal";
import { RefreshIndicator } from "@/components/ui/RefreshIndicator";
import { ServiceCard } from "./ServiceCard";

function SkeletonCard() {
  return (
    <div className="glass flex h-full flex-col gap-4 p-5" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="skeleton size-11" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-2/3" />
          <div className="skeleton h-2.5 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-2.5 w-full" />
        <div className="skeleton h-2.5 w-4/5" />
      </div>
      <div className="skeleton h-14 w-full" />
      <div className="flex justify-between">
        <div className="skeleton h-8 w-24" />
        <div className="skeleton h-3 w-20 self-center" />
      </div>
    </div>
  );
}

export function ServiceGrid() {
  const {
    snapshot,
    loading,
    refreshing,
    lastError,
    category,
    editMode,
    setEditMode,
    reorder,
    openEditor,
    refreshAll,
    removeService,
  } = useDashboard();
  const categories = useCategories();
  const [deleteTarget, setDeleteTarget] = useState<DashboardService | null>(null);

  const services = useMemo(
    () =>
      (snapshot?.services ?? []).filter((s) => matchesCategory(s, category)),
    [snapshot, category],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !snapshot) return;
    const all = snapshot.services;
    const oldIndex = all.findIndex((s) => s.id === active.id);
    const newIndex = all.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void reorder(arrayMove(all, oldIndex, newIndex).map((s) => s.id));
  };

  const activeCategory = categories.find((c) => c.key === category);
  const showSkeletons = loading && !snapshot;

  return (
    <section aria-label={t.a11y.statusLive} aria-busy={refreshing}>
      {/* section header */}
      <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-line pb-3">
        <div>
          <p className="section-kicker mb-1.5">{t.workspace.serviceDirectory}</p>
          <h2 className="text-lg font-semibold tracking-[-0.025em]">
            {activeCategory?.label ?? t.categories.all}
            <span className="ml-2 font-mono text-xs font-normal text-ink-3 tabular-nums">
              / {String(services.length).padStart(2, "0")}
            </span>
          </h2>
        </div>
        <div className="hidden sm:block">
          <RefreshIndicator compact />
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => void refreshAll()}
          disabled={refreshing}
          className="control-button inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-2 transition-colors hover:text-ink disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? "spin-slow" : undefined} aria-hidden />
          {t.actions.refreshAll}
        </button>
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          aria-pressed={editMode}
          className={`inline-flex items-center gap-1.5 rounded-[3px] border px-3 py-2 text-xs font-medium transition-colors ${
            editMode
              ? "border-accent/40 bg-accent-soft text-ink"
              : "border-line bg-soft text-ink-2 hover:border-line-strong hover:bg-soft-2 hover:text-ink"
          }`}
        >
          <LayoutList size={13} aria-hidden />
          {editMode ? t.actions.exitEditMode : t.actions.enterEditMode}
        </button>
        <button
          type="button"
          onClick={() => openEditor(null)}
          className="primary-action inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
        >
          <Plus size={13} aria-hidden />
          {t.actions.addService}
        </button>
      </div>

      {editMode && (
        <p className="mb-3 rounded-xl border border-accent/25 bg-accent-soft px-3.5 py-2.5 text-xs text-ink-2">
          {t.actions.dragToReorder}
        </p>
      )}

      {lastError && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-warn/30 bg-warn/10 px-3.5 py-2.5 text-xs text-warn">
          <CircleAlert size={14} aria-hidden />
          <span className="flex-1">{lastError}</span>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="rounded-lg border border-warn/30 px-2.5 py-1 font-medium transition-colors hover:bg-warn/10"
          >
            {t.actions.retry}
          </button>
        </div>
      )}

      {/* grid */}
      {showSkeletons ? (
        <div
          className="grid grid-cols-1 gap-3.5 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]"
          aria-label={t.a11y.loadingServices}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 px-6 py-14 text-center">
          <SearchX size={28} className="text-ink-3" aria-hidden />
          <p className="text-sm text-ink-2">{t.empty.noServicesInCategory}</p>
          <button
            type="button"
            onClick={() => openEditor(null)}
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-accent/35 bg-accent-soft px-3.5 py-2 text-xs font-medium transition-colors hover:bg-accent/25"
          >
            <Plus size={13} aria-hidden />
            {t.actions.addService}
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={services.map((s) => s.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className={`grid grid-cols-1 gap-3.5 transition-opacity duration-300 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] ${
                refreshing ? "opacity-[0.93]" : ""
              }`}
            >
              {services.map((svc, index) => (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  index={index}
                  onRequestDelete={setDeleteTarget}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t.editor.deleteConfirmTitle}
      >
        {deleteTarget && (
          <div>
            <p className="text-sm leading-relaxed text-ink-2">
              {t.editor.deleteConfirmBody(deleteTarget.name)}
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-line bg-soft px-4 py-2 text-xs font-medium text-ink-2 transition-colors hover:border-line-strong hover:bg-soft-2 hover:text-ink"
              >
                {t.actions.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  void removeService(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="rounded-xl border border-crit/40 bg-crit/15 px-4 py-2 text-xs font-medium text-crit transition-colors hover:bg-crit/25"
              >
                {t.actions.deleteService}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

/** Mobile horizontal category chips (sidebar is hidden below lg). */
export function CategoryFilter() {
  const { category, setCategory } = useDashboard();
  const categories = useCategories();
  return (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
      role="tablist"
      aria-label={t.categories.all}
    >
      {categories.map(({ key, label, count, icon: Icon }) => {
        const active = category === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setCategory(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
              active
                ? "border-accent/40 bg-accent-soft text-ink"
                : "border-line bg-soft text-ink-2"
            }`}
          >
            <Icon size={13} aria-hidden />
            {label}
            <span className="tabular-nums text-ink-3">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
