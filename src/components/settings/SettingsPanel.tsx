"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Moon, ShieldAlert, ShieldCheck, Sun } from "lucide-react";
import { springSnappy } from "@/lib/motion";
import { t } from "@/locales/zh-CN";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { Modal } from "@/components/ui/Modal";
import { useCategories } from "@/components/layout/useCategories";

function SecuritySection() {
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((s: { enabled: boolean }) => setAuthEnabled(s.enabled))
      .catch(() => setAuthEnabled(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.replace("/login");
  }

  if (authEnabled === null) return null;

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
        {t.auth.securitySection}
      </h3>
      {authEnabled ? (
        <>
          <p className="mt-1.5 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ok" aria-hidden />
            {t.auth.securityEnabled}
          </p>
          <button
            type="button"
            onClick={logout}
            className="pressable mt-3 flex items-center gap-2 rounded-xl border border-crit/35 bg-crit/10 px-4 py-2 text-xs font-medium text-crit hover:bg-crit/20"
          >
            <LogOut size={13} aria-hidden />
            {t.auth.logout}
          </button>
        </>
      ) : (
        <p className="mt-1.5 flex items-start gap-2 rounded-xl border border-warn/35 bg-warn/10 px-3 py-2.5 text-xs leading-relaxed text-warn">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
          {t.auth.securityDisabled}
        </p>
      )}
    </section>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      whileTap="pressed"
      className={`flex h-6 w-11 shrink-0 touch-manipulation items-center rounded-full border px-0.5 transition-colors [-webkit-tap-highlight-color:transparent] ${
        checked
          ? "justify-end border-accent bg-accent"
          : "justify-start border-line-strong bg-ink/10"
      }`}
    >
      {/* knob stretches under the finger while pressed, anchored to the far
          edge, then springs to the other side — the far edge hints where the
          toggle is heading */}
      <motion.span
        layout
        variants={{ pressed: { width: "1.35rem" } }}
        transition={springSnappy}
        className={`h-4.5 w-4.5 rounded-full shadow-md ${
          checked ? "bg-canvas" : "bg-ink"
        }`}
        aria-hidden
      />
    </motion.button>
  );
}

const INTERVALS: Array<{ value: number | null; label: string }> = [
  { value: 10, label: t.settingsPanel.interval10 },
  { value: 30, label: t.settingsPanel.interval30 },
  { value: 60, label: t.settingsPanel.interval60 },
  { value: 300, label: t.settingsPanel.interval300 },
  { value: 900, label: t.settingsPanel.interval900 },
  { value: null, label: t.settingsPanel.intervalManual },
];

export function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings, snapshot } =
    useDashboard();
  const categories = useCategories();

  return (
    <Modal
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      title={t.settingsPanel.title}
    >
      <div className="space-y-6">
        {/* appearance */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            {t.settingsPanel.appearanceSection}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
            {t.settingsPanel.appearanceDescription}
          </p>
          <div
            className="mt-3 grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label={t.settingsPanel.appearanceSection}
          >
            {(
              [
                { value: "dark", label: t.settingsPanel.themeDark, icon: Moon },
                { value: "light", label: t.settingsPanel.themeLight, icon: Sun },
              ] as const
            ).map(({ value, label, icon: Icon }) => {
              const selected = settings.theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => updateSettings({ theme: value })}
                  className={`pressable flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${
                    selected
                      ? "border-accent/50 bg-accent-soft text-ink"
                      : "border-line bg-soft text-ink-2 hover:border-line-strong hover:bg-soft-2"
                  }`}
                >
                  <Icon size={13} aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* refresh interval */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            {t.settingsPanel.refreshSection}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
            {t.settingsPanel.refreshDescription}
          </p>
          <div
            className="mt-3 grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label={t.settingsPanel.refreshSection}
          >
            {INTERVALS.map(({ value, label }) => {
              const selected = settings.refreshIntervalSeconds === value;
              return (
                <button
                  key={String(value)}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => updateSettings({ refreshIntervalSeconds: value })}
                  className={`pressable rounded-xl border px-3 py-2.5 text-xs font-medium ${
                    selected
                      ? "border-accent/50 bg-accent-soft text-ink"
                      : "border-line bg-soft text-ink-2 hover:border-line-strong hover:bg-soft-2"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* notifications */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
              {t.settingsPanel.notificationsSection}
            </h3>
            <p className="mt-1.5 text-xs text-ink-2">
              {t.settingsPanel.notificationsToggle}
            </p>
          </div>
          <Switch
            checked={settings.notificationsEnabled}
            onChange={(v) => updateSettings({ notificationsEnabled: v })}
            label={t.settingsPanel.notificationsToggle}
          />
        </section>

        {/* motion */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
              {t.settingsPanel.motionSection}
            </h3>
            <p className="mt-1.5 text-xs text-ink-2">{t.settingsPanel.motionToggle}</p>
            <p className="mt-0.5 text-[11px] text-ink-3">
              {t.settingsPanel.motionDescription}
            </p>
          </div>
          <Switch
            checked={settings.reduceMotion}
            onChange={(v) => updateSettings({ reduceMotion: v })}
            label={t.settingsPanel.motionToggle}
          />
        </section>

        {/* categories overview */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            {t.settingsPanel.categoriesSection}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
            {t.settingsPanel.categoriesDescription}
          </p>
          <ul className="mt-3 space-y-1.5">
            {categories
              .filter((c) => !["all", "favorites", "offline"].includes(c.key))
              .map(({ key, label, icon: Icon, count }) => (
                <li
                  key={key}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-soft px-3 py-2.5 text-xs"
                >
                  <Icon size={14} className="text-ink-3" aria-hidden />
                  <span className="flex-1 font-medium">{label}</span>
                  <span className="text-ink-3">
                    {t.settingsPanel.servicesCount(count)}
                  </span>
                </li>
              ))}
          </ul>
        </section>

        <SecuritySection />

        {/* data note */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            {t.settingsPanel.dataSection}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
            {t.settingsPanel.dataDescription}
          </p>
          {snapshot && (
            <p className="mt-1.5 text-[11px] text-ink-3">
              {t.header.servicesMonitored}：{snapshot.overall.monitored}
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
