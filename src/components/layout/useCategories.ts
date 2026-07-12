"use client";

import { useMemo } from "react";
import {
  Clapperboard,
  CloudOff,
  FolderKanban,
  LayoutGrid,
  Network,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";
import type { CategoryKey, DashboardService } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { useDashboard } from "@/components/dashboard/DashboardProvider";

export interface CategoryItem {
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
  count: number;
}

export function matchesCategory(svc: DashboardService, key: CategoryKey): boolean {
  switch (key) {
    case "all":
      return true;
    case "favorites":
      return svc.favorite;
    case "offline":
      return svc.status === "offline" || svc.status === "critical";
    default:
      return svc.category === key;
  }
}

const ORDER: Array<{ key: CategoryKey; icon: LucideIcon }> = [
  { key: "all", icon: LayoutGrid },
  { key: "favorites", icon: Star },
  { key: "personal", icon: User },
  { key: "media", icon: Clapperboard },
  { key: "productivity", icon: FolderKanban },
  { key: "infrastructure", icon: Network },
  { key: "offline", icon: CloudOff },
];

export function useCategories(): CategoryItem[] {
  const { snapshot } = useDashboard();
  return useMemo(() => {
    const services = snapshot?.services ?? [];
    return ORDER.map(({ key, icon }) => ({
      key,
      icon,
      label: t.categories[key],
      count: services.filter((s) => matchesCategory(s, key)).length,
    }));
  }, [snapshot]);
}
