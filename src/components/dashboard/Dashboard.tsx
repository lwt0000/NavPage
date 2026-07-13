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
  const { settings, snapshot } = useDashboard();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const overall = snapshot?.overall;

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

        <div className="mx-auto flex max-w-[1680px] items-start gap-5 px-4 pb-12 pt-4 lg:px-6 lg:pt-5">
          <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

          <main id="main" className="min-w-0 flex-1 space-y-5">
            <NetworkBanner />
            <section className="dashboard-intro" aria-labelledby="workspace-title">
              <div>
                <p className="intro-kicker">{t.workspace.kicker}</p>
                <h2 id="workspace-title" className="intro-title">{t.workspace.title}</h2>
                <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-3 sm:text-sm">
                  {t.app.subtitle}
                </p>
              </div>
              <dl className="intro-meta" aria-label={t.metrics.healthOverview}>
                <div>
                  <dt className="text-[10px] text-ink-3">{t.workspace.monitored}</dt>
                  <dd className="mt-1 font-mono text-xl tabular-nums">
                    {overall?.monitored ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-ink-3">{t.workspace.available}</dt>
                  <dd className="mt-1 font-mono text-xl tabular-nums text-ok">
                    {overall?.online ?? "—"}
                  </dd>
                </div>
              </dl>
            </section>
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

          <aside className="sticky top-[4.75rem] hidden w-[20rem] shrink-0 space-y-5 2xl:block">
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
