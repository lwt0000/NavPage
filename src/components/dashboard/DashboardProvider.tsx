"use client";

/**
 * Client-side state core: snapshot polling (visibility-aware), retries,
 * optimistic mutations, settings persistence, toasts and global UI state.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CategoryKey,
  DashboardService,
  HealthSnapshot,
  ServiceInput,
} from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { formatClockTime, formatFullDate, formatLatency, formatPercent } from "@/lib/format";

export type ThemeName = "dark" | "light";

export interface DashboardSettings {
  /** null = manual refresh only */
  refreshIntervalSeconds: number | null;
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  theme: ThemeName;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  refreshIntervalSeconds: 30,
  notificationsEnabled: true,
  reduceMotion: false,
  theme: "dark",
};

const SETTINGS_KEY = "wcc:settings";
const RECENT_KEY = "wcc:recent";

export interface Toast {
  id: number;
  severity: "info" | "success" | "warning" | "critical";
  title: string;
  body?: string;
}

interface EditorState {
  open: boolean;
  service: DashboardService | null;
}

interface DashboardContextValue {
  snapshot: HealthSnapshot | null;
  loading: boolean;
  refreshing: boolean;
  lastError: string | null;
  networkDown: boolean;
  settings: DashboardSettings;
  updateSettings: (patch: Partial<DashboardSettings>) => void;
  refreshAll: () => Promise<void>;
  checkOne: (id: string) => Promise<void>;
  saveService: (input: ServiceInput, id?: string) => Promise<boolean>;
  patchService: (
    id: string,
    patch: Partial<DashboardService>,
    opts?: { toast?: boolean },
  ) => Promise<boolean>;
  removeService: (id: string) => Promise<boolean>;
  reorder: (ids: string[]) => Promise<void>;
  toggleFavorite: (svc: DashboardService) => void;
  openService: (svc: DashboardService) => void;
  recentIds: string[];
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  editor: EditorState;
  openEditor: (svc?: DashboardService | null) => void;
  closeEditor: () => void;
  category: CategoryKey;
  setCategory: (c: CategoryKey) => void;
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  exportReport: () => void;
  openAllFavorites: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  retries = 2,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? t.empty.cannotFetch);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

function severityForStatus(status: DashboardService["status"]): Toast["severity"] {
  switch (status) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "critical":
    case "offline":
      return "critical";
    default:
      return "info";
  }
}

let toastSeq = 1;

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshotState] = useState<HealthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [networkDown, setNetworkDown] = useState(false);
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [editMode, setEditMode] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>({ open: false, service: null });
  const [category, setCategory] = useState<CategoryKey>("all");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);

  const snapshotRef = useRef<HealthSnapshot | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const inFlight = useRef(false);

  const setSnapshot = useCallback((next: HealthSnapshot | null) => {
    snapshotRef.current = next;
    setSnapshotState(next);
  }, []);

  /* ---------------- toasts ---------------- */

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = toastSeq++;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismissToast(id), 5200);
    },
    [dismissToast],
  );

  /* ---------------- snapshot application + change notifications ---------------- */

  const applySnapshot = useCallback(
    (next: HealthSnapshot, notify: boolean) => {
      const prev = snapshotRef.current;
      if (notify && prev && settingsRef.current.notificationsEnabled) {
        const prevStatus = new Map(prev.services.map((s) => [s.id, s.status]));
        let announced = 0;
        for (const svc of next.services) {
          const old = prevStatus.get(svc.id);
          if (old && old !== "unknown" && old !== svc.status && announced < 3) {
            announced += 1;
            pushToast({
              severity: severityForStatus(svc.status),
              title: t.toasts.statusChange(svc.name, t.status[svc.status]),
            });
          }
        }
      }
      setSnapshot(next);
    },
    [pushToast, setSnapshot],
  );

  /* ---------------- refresh ---------------- */

  const refreshAll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const snap = await fetchJson<HealthSnapshot>("/api/health/check", {
        method: "POST",
      });
      applySnapshot(snap, true);
      setLastError(null);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : t.empty.checkFailed);
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, [applySnapshot]);

  const checkOne = useCallback(
    async (id: string) => {
      try {
        const snap = await fetchJson<HealthSnapshot>(`/api/health/check/${id}`, {
          method: "POST",
        });
        applySnapshot(snap, true);
      } catch (err) {
        setLastError(err instanceof Error ? err.message : t.empty.checkFailed);
      }
    },
    [applySnapshot],
  );

  /* ---------------- initial load ---------------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await fetchJson<HealthSnapshot>("/api/health");
        if (!cancelled) {
          applySnapshot(snap, false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setLastError(t.empty.cannotFetch);
        }
      }
      if (!cancelled) void refreshAll();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- settings + recents persistence ---------------- */

  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const stored: DashboardSettings = raw
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
        : { ...DEFAULT_SETTINGS };
      // ?theme= previews a theme without persisting it (see layout.tsx);
      // it must also seed the state or this effect would clobber the preview.
      const preview = new URLSearchParams(window.location.search).get("theme");
      if (preview === "light" || preview === "dark") stored.theme = preview;
      setSettings(stored);
      const recent = localStorage.getItem(RECENT_KEY);
      if (recent) setRecentIds(JSON.parse(recent));
    } catch {
      // ignore corrupt local data
    }
    setSettingsLoaded(true);
  }, []);

  const updateSettings = useCallback((patch: Partial<DashboardSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // storage may be unavailable; settings stay in memory
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", settings.reduceMotion);
  }, [settings.reduceMotion]);

  // The inline script in layout.tsx applies the stored theme before first
  // paint; don't touch the attribute until stored settings have been read,
  // or the default would briefly clobber it.
  useEffect(() => {
    if (!settingsLoaded) return;
    if (settings.theme === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", settings.theme === "light" ? "#efede7" : "#0c0d0d");
  }, [settingsLoaded, settings.theme]);

  /* ---------------- visibility-aware polling ---------------- */

  useEffect(() => {
    const onVisibility = () => {
      setHidden(document.hidden);
      if (!document.hidden) {
        const interval = settingsRef.current.refreshIntervalSeconds;
        const last = snapshotRef.current?.overall.lastFullRefreshAt;
        const stale =
          interval != null &&
          (!last || Date.now() - new Date(last).getTime() > interval * 1000);
        if (stale) void refreshAll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refreshAll]);

  useEffect(() => {
    const interval = settings.refreshIntervalSeconds;
    if (interval == null) return;
    // Background tabs poll 4x slower to save network + battery.
    const effective = hidden ? Math.max(interval * 4, 120) : interval;
    const id = window.setInterval(() => void refreshAll(), effective * 1000);
    return () => window.clearInterval(id);
  }, [settings.refreshIntervalSeconds, hidden, refreshAll]);

  /* ---------------- browser online/offline ---------------- */

  useEffect(() => {
    const goOffline = () => {
      setNetworkDown(true);
      pushToast({ severity: "warning", title: t.toasts.offlineNetwork });
    };
    const goOnline = () => {
      setNetworkDown(false);
      pushToast({ severity: "success", title: t.toasts.onlineNetwork });
      void refreshAll();
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [pushToast, refreshAll]);

  /* ---------------- command palette shortcut ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------------- mutations ---------------- */

  const mutateLocal = useCallback(
    (id: string, patch: Partial<DashboardService>) => {
      const prev = snapshotRef.current;
      if (!prev) return;
      setSnapshot({
        ...prev,
        services: prev.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      });
    },
    [setSnapshot],
  );

  const refreshSnapshotOnly = useCallback(async () => {
    try {
      const snap = await fetchJson<HealthSnapshot>("/api/health");
      applySnapshot(snap, false);
    } catch {
      // keep the previous snapshot on failure
    }
  }, [applySnapshot]);

  const patchService = useCallback(
    async (
      id: string,
      patch: Partial<DashboardService>,
      opts?: { toast?: boolean },
    ) => {
      const prev = snapshotRef.current?.services.find((s) => s.id === id);
      mutateLocal(id, patch);
      try {
        await fetchJson(`/api/services/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (opts?.toast) pushToast({ severity: "success", title: t.toasts.serviceSaved });
        void refreshSnapshotOnly();
        return true;
      } catch {
        if (prev) mutateLocal(id, prev);
        pushToast({ severity: "critical", title: t.toasts.saveFailed });
        return false;
      }
    },
    [mutateLocal, pushToast, refreshSnapshotOnly],
  );

  const saveService = useCallback(
    async (input: ServiceInput, id?: string) => {
      try {
        if (id) {
          await fetchJson(`/api/services/${id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(input),
          });
          await refreshSnapshotOnly();
          void checkOne(id);
        } else {
          const created = await fetchJson<{ service: DashboardService }>(
            "/api/services",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(input),
            },
            0,
          );
          await refreshSnapshotOnly();
          void checkOne(created.service.id);
        }
        pushToast({ severity: "success", title: t.toasts.serviceSaved });
        return true;
      } catch (err) {
        pushToast({
          severity: "critical",
          title: err instanceof Error ? err.message : t.toasts.saveFailed,
        });
        return false;
      }
    },
    [checkOne, pushToast, refreshSnapshotOnly],
  );

  const removeService = useCallback(
    async (id: string) => {
      try {
        await fetchJson(`/api/services/${id}`, { method: "DELETE" });
        await refreshSnapshotOnly();
        pushToast({ severity: "info", title: t.toasts.serviceDeleted });
        return true;
      } catch {
        pushToast({ severity: "critical", title: t.toasts.saveFailed });
        return false;
      }
    },
    [pushToast, refreshSnapshotOnly],
  );

  const reorder = useCallback(
    async (ids: string[]) => {
      const prev = snapshotRef.current;
      if (prev) {
        const byId = new Map(prev.services.map((s) => [s.id, s]));
        const next = ids
          .map((id, i) => {
            const svc = byId.get(id);
            return svc ? { ...svc, order: i } : null;
          })
          .filter((s): s is DashboardService => s !== null);
        setSnapshot({ ...prev, services: next });
      }
      try {
        await fetchJson("/api/services/reorder", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids }),
        });
      } catch {
        void refreshSnapshotOnly();
      }
    },
    [refreshSnapshotOnly, setSnapshot],
  );

  const toggleFavorite = useCallback(
    (svc: DashboardService) => {
      void patchService(svc.id, { favorite: !svc.favorite });
    },
    [patchService],
  );

  const openService = useCallback((svc: DashboardService) => {
    setRecentIds((prev) => {
      const next = [svc.id, ...prev.filter((id) => id !== svc.id)].slice(0, 6);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // non-fatal
      }
      return next;
    });
    if (svc.openInNewTab) {
      window.open(svc.navigationUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = svc.navigationUrl;
    }
  }, []);

  const openAllFavorites = useCallback(() => {
    const favorites =
      snapshotRef.current?.services.filter((s) => s.favorite) ?? [];
    let opened = 0;
    for (const svc of favorites) {
      const win = window.open(svc.navigationUrl, "_blank", "noopener,noreferrer");
      if (win) opened += 1;
    }
    if (opened < favorites.length) {
      pushToast({ severity: "warning", title: t.toasts.popupBlocked });
    } else if (opened > 0) {
      pushToast({ severity: "info", title: t.toasts.favoritesOpened(opened) });
    }
  }, [pushToast]);

  /* ---------------- status report export ---------------- */

  const exportReport = useCallback(() => {
    const snap = snapshotRef.current;
    if (!snap) return;
    const now = new Date();
    const lines: string[] = [
      `# ${t.app.title} — 状态报告`,
      "",
      `- ${t.metrics.lastUpdated}：${formatFullDate(now)} ${formatClockTime(now)}`,
      `- ${t.header.overallHealth}：${snap.overall.score}%`,
      `- ${t.header.online}：${snap.overall.online} / ${snap.overall.monitored}`,
      `- ${t.metrics.avgResponse}：${formatLatency(snap.overall.avgLatencyMs)}`,
      `- ${t.metrics.totalUptime}：${formatPercent(snap.overall.totalUptime, 2)}`,
      "",
      `## 服务明细`,
      "",
      `| 服务 | 状态 | ${t.metrics.healthScore} | ${t.metrics.latency} | ${t.metrics.uptime} |`,
      `| --- | --- | --- | --- | --- |`,
      ...snap.services.map(
        (s) =>
          `| ${s.name} (${s.displayUrl}) | ${t.status[s.status]} | ${s.healthScore}% | ${formatLatency(s.latencyMs)} | ${formatPercent(s.uptimePercentage, 2)} |`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    a.href = url;
    a.download = `status-report-${stamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ severity: "success", title: t.toasts.reportExported });
  }, [pushToast]);

  /* ---------------- editor helpers ---------------- */

  const openEditor = useCallback((svc?: DashboardService | null) => {
    setEditor({ open: true, service: svc ?? null });
  }, []);
  const closeEditor = useCallback(() => {
    setEditor({ open: false, service: null });
  }, []);

  const value = useMemo<DashboardContextValue>(
    () => ({
      snapshot,
      loading,
      refreshing,
      lastError,
      networkDown,
      settings,
      updateSettings,
      refreshAll,
      checkOne,
      saveService,
      patchService,
      removeService,
      reorder,
      toggleFavorite,
      openService,
      recentIds,
      editMode,
      setEditMode,
      paletteOpen,
      setPaletteOpen,
      settingsOpen,
      setSettingsOpen,
      editor,
      openEditor,
      closeEditor,
      category,
      setCategory,
      toasts,
      pushToast,
      dismissToast,
      exportReport,
      openAllFavorites,
    }),
    [
      snapshot, loading, refreshing, lastError, networkDown, settings,
      updateSettings, refreshAll, checkOne, saveService, patchService,
      removeService, reorder, toggleFavorite, openService, recentIds,
      editMode, paletteOpen, settingsOpen, editor, openEditor, closeEditor,
      category, toasts, pushToast, dismissToast, exportReport, openAllFavorites,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
