"use client";

import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { WifiOff } from "lucide-react";
import { t } from "@/locales/zh-CN";
import { useDashboard } from "./DashboardProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { HealthOverview } from "@/components/health/HealthOverview";
import { HealthHistoryChart } from "@/components/health/HealthHistoryChart";
import { LatencyChart } from "@/components/health/LatencyChart";
import { CategoryFilter, ServiceGrid } from "@/components/services/ServiceGrid";
import { RouteComparison } from "@/components/services/RouteComparison";
import { ServiceEditor } from "@/components/services/ServiceEditor";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { QuickActions } from "@/components/actions/QuickActions";
import { CommandPalette } from "@/components/palette/CommandPalette";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Toasts } from "@/components/ui/Toasts";

function NetworkBanner() {
  const { networkDown } = useDashboard();
  if (!networkDown) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2.5 rounded-xl border border-warn/35 bg-warn/10 px-4 py-3 text-sm font-medium text-warn"
    >
      <WifiOff size={15} aria-hidden />
      {t.toasts.offlineNetwork}
    </div>
  );
}

export function Dashboard() {
  const { settings } = useDashboard();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "user"}>
      <a
        href="#main"
        className="sr-only z-[80] rounded-xl border border-accent/50 bg-surface px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.app.skipToContent}
      </a>

      {/* fixed ambient environment */}
      <div className="ambient" aria-hidden>
        <div className="ambient-glow" />
        <div className="ambient-blob ambient-blob--one" />
        <div className="ambient-blob ambient-blob--two" />
        <div className="ambient-blob ambient-blob--three" />
        <div className="ambient-grid" />
        <div className="ambient-noise" />
        <div className="ambient-vignette" />
      </div>

      <div className="relative z-10">
        <AppHeader onMenuClick={() => setMobileNavOpen(true)} />

        <div className="mx-auto flex max-w-[1720px] items-start gap-5 px-4 pb-10 pt-5 lg:px-6">
          <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

          <main id="main" className="min-w-0 flex-1 space-y-5">
            <NetworkBanner />
            <CategoryFilter />
            <HealthOverview />
            <ServiceGrid />
            <RouteComparison />
            <div className="grid gap-5 xl:grid-cols-2">
              <HealthHistoryChart />
              <LatencyChart />
            </div>
            {/* on narrower screens the rail content flows below the main column */}
            <div className="space-y-5 2xl:hidden">
              <QuickActions />
              <ActivityTimeline />
            </div>
          </main>

          <aside className="sticky top-[4.75rem] hidden w-[21.5rem] shrink-0 space-y-5 2xl:block">
            <QuickActions />
            <ActivityTimeline />
          </aside>
        </div>
      </div>

      <CommandPalette />
      <ServiceEditor />
      <SettingsPanel />
      <Toasts />
    </MotionConfig>
  );
}
