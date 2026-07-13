"use client";

import { useEffect, useState } from "react";
import type { AuthMode, ServiceCategory, ServiceInput, ServicePriority } from "@/lib/types";
import { t } from "@/locales/zh-CN";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { Modal } from "@/components/ui/Modal";
import { ICON_CHOICES, getServiceIcon } from "./service-icons";

const inputCls =
  "w-full rounded-xl border border-line-strong bg-well px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent/60 focus:bg-soft";
const labelCls = "mb-1.5 block text-xs font-medium text-ink-2";

interface FormState {
  name: string;
  description: string;
  displayUrl: string;
  navigationUrl: string;
  healthCheckUrl: string;
  icon: string;
  category: ServiceCategory;
  tags: string;
  priority: ServicePriority;
  expectedStatusCodes: string;
  checkIntervalSeconds: number;
  timeoutMs: number;
  authMode: AuthMode;
  followRedirects: boolean;
  openInNewTab: boolean;
  favorite: boolean;
  admin: boolean;
  monitoringEnabled: boolean;
}

const DEFAULT_FORM: FormState = {
  name: "",
  description: "",
  displayUrl: "",
  navigationUrl: "",
  healthCheckUrl: "",
  icon: "globe",
  category: "productivity",
  tags: "",
  priority: "medium",
  expectedStatusCodes: "200",
  checkIntervalSeconds: 60,
  timeoutMs: 8000,
  authMode: "none",
  followRedirects: true,
  openInNewTab: true,
  favorite: false,
  admin: false,
  monitoringEnabled: true,
};

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ServiceEditor() {
  const { editor, closeEditor, saveService } = useDashboard();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<"name" | "navigationUrl", string>>>({});
  const [saving, setSaving] = useState(false);

  const service = editor.service;

  useEffect(() => {
    if (!editor.open) return;
    setErrors({});
    if (service) {
      setForm({
        name: service.name,
        description: service.description,
        displayUrl: service.displayUrl,
        navigationUrl: service.navigationUrl,
        healthCheckUrl: service.healthCheckUrl,
        icon: service.icon,
        category: service.category,
        tags: service.tags.join(", "),
        priority: service.priority,
        expectedStatusCodes: service.expectedStatusCodes.join(", "),
        checkIntervalSeconds: service.checkIntervalSeconds,
        timeoutMs: service.timeoutMs,
        authMode: service.authMode,
        followRedirects: service.followRedirects,
        openInNewTab: service.openInNewTab,
        favorite: service.favorite,
        admin: service.admin,
        monitoringEnabled: service.monitoringEnabled,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editor.open, service]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = t.editor.validation.nameRequired;
    if (!form.navigationUrl.trim()) {
      nextErrors.navigationUrl = t.editor.validation.urlRequired;
    } else if (!isValidUrl(form.navigationUrl.trim())) {
      nextErrors.navigationUrl = t.editor.validation.urlInvalid;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: ServiceInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      displayUrl: form.displayUrl.trim() || undefined,
      navigationUrl: form.navigationUrl.trim(),
      healthCheckUrl: form.healthCheckUrl.trim() || undefined,
      icon: form.icon,
      category: form.category,
      tags: form.tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      priority: form.priority,
      expectedStatusCodes: form.expectedStatusCodes
        .split(/[,，]/)
        .map((code) => parseInt(code.trim(), 10))
        .filter((code) => Number.isInteger(code) && code >= 100 && code <= 599),
      checkIntervalSeconds: form.checkIntervalSeconds,
      timeoutMs: Math.max(1000, form.timeoutMs),
      authMode: form.authMode,
      followRedirects: form.followRedirects,
      openInNewTab: form.openInNewTab,
      favorite: form.favorite,
      admin: form.admin,
      monitoringEnabled: form.monitoringEnabled,
    };

    setSaving(true);
    const ok = await saveService(input, service?.id);
    setSaving(false);
    if (ok) closeEditor();
  };

  const SelectedIcon = getServiceIcon(form.icon);

  return (
    <Modal
      open={editor.open}
      onClose={closeEditor}
      title={service ? t.editor.editTitle : t.editor.addTitle}
      wide
    >
      <form onSubmit={submit} noValidate>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-3">
          {t.editor.sectionBasic}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="svc-name" className={labelCls}>
              {t.editor.name}
            </label>
            <input
              id="svc-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={`${inputCls} ${errors.name ? "border-crit/60" : ""}`}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="mt-1 text-[11px] text-crit">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="svc-display-url" className={labelCls}>
              {t.editor.displayUrl}
            </label>
            <input
              id="svc-display-url"
              value={form.displayUrl}
              onChange={(e) => set("displayUrl", e.target.value)}
              placeholder="example.com"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="svc-description" className={labelCls}>
              {t.editor.description}
            </label>
            <textarea
              id="svc-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="svc-nav-url" className={labelCls}>
              {t.editor.navigationUrl}
            </label>
            <input
              id="svc-nav-url"
              type="url"
              value={form.navigationUrl}
              onChange={(e) => set("navigationUrl", e.target.value)}
              placeholder="https://"
              className={`${inputCls} ${errors.navigationUrl ? "border-crit/60" : ""}`}
              aria-invalid={Boolean(errors.navigationUrl)}
            />
            {errors.navigationUrl && (
              <p className="mt-1 text-[11px] text-crit">{errors.navigationUrl}</p>
            )}
          </div>
          <div>
            <label htmlFor="svc-category" className={labelCls}>
              {t.editor.category}
            </label>
            <select
              id="svc-category"
              value={form.category}
              onChange={(e) => set("category", e.target.value as ServiceCategory)}
              className={inputCls}
            >
              {(["personal", "media", "productivity", "infrastructure"] as const).map(
                (key) => (
                  <option key={key} value={key}>
                    {t.categories[key]}
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label htmlFor="svc-tags" className={labelCls}>
              {t.editor.tags}
            </label>
            <input
              id="svc-tags"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder={t.editor.tagsHint}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="svc-priority" className={labelCls}>
              {t.editor.priority}
            </label>
            <select
              id="svc-priority"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as ServicePriority)}
              className={inputCls}
            >
              <option value="high">{t.metrics.priorityHigh}</option>
              <option value="medium">{t.metrics.priorityMedium}</option>
              <option value="low">{t.metrics.priorityLow}</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <span className={labelCls}>{t.editor.icon}</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.editor.icon}>
              {ICON_CHOICES.map((name) => {
                const Icon = getServiceIcon(name);
                const selected = form.icon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={name}
                    onClick={() => set("icon", name)}
                    className={`grid size-9 place-items-center rounded-lg border transition-colors ${
                      selected
                        ? "border-accent/60 bg-accent-soft text-accent"
                        : "border-line bg-soft text-ink-3 hover:border-line-strong hover:text-ink-2"
                    }`}
                  >
                    <Icon size={15} aria-hidden />
                  </button>
                );
              })}
              <span className="ml-1 inline-flex items-center gap-1.5 text-[11px] text-ink-3">
                <SelectedIcon size={13} aria-hidden /> {form.icon}
              </span>
            </div>
          </div>
        </div>

        <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-ink-3">
          {t.editor.sectionCheck}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="svc-hc-url" className={labelCls}>
              {t.editor.healthCheckUrl}
            </label>
            <input
              id="svc-hc-url"
              type="url"
              value={form.healthCheckUrl}
              onChange={(e) => set("healthCheckUrl", e.target.value)}
              placeholder={form.navigationUrl || "https://"}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-ink-3">{t.editor.healthCheckUrlHint}</p>
          </div>
          <div>
            <label htmlFor="svc-status-codes" className={labelCls}>
              {t.editor.expectedStatus}
            </label>
            <input
              id="svc-status-codes"
              value={form.expectedStatusCodes}
              onChange={(e) => set("expectedStatusCodes", e.target.value)}
              placeholder="200, 204"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-ink-3">{t.editor.expectedStatusHint}</p>
          </div>
          <div>
            <label htmlFor="svc-auth-mode" className={labelCls}>
              {t.editor.authMode}
            </label>
            <select
              id="svc-auth-mode"
              value={form.authMode}
              onChange={(e) => set("authMode", e.target.value as AuthMode)}
              className={inputCls}
            >
              <option value="none">{t.editor.authModeNone}</option>
              <option value="expected">{t.editor.authModeExpected}</option>
            </select>
          </div>
          <div>
            <label htmlFor="svc-interval" className={labelCls}>
              {t.editor.checkInterval}
            </label>
            <select
              id="svc-interval"
              value={form.checkIntervalSeconds}
              onChange={(e) => set("checkIntervalSeconds", Number(e.target.value))}
              className={inputCls}
            >
              <option value={10}>{t.settingsPanel.interval10}</option>
              <option value={30}>{t.settingsPanel.interval30}</option>
              <option value={60}>{t.settingsPanel.interval60}</option>
              <option value={300}>{t.settingsPanel.interval300}</option>
              <option value={900}>{t.settingsPanel.interval900}</option>
            </select>
          </div>
          <div>
            <label htmlFor="svc-timeout" className={labelCls}>
              {t.editor.timeout}
            </label>
            <input
              id="svc-timeout"
              type="number"
              min={1000}
              step={500}
              value={form.timeoutMs}
              onChange={(e) => set("timeoutMs", Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {(
            [
              ["followRedirects", t.editor.followRedirects],
              ["openInNewTab", t.editor.openInNewTab],
              ["favorite", t.editor.favorite],
              ["admin", t.editor.adminFlag],
              ["monitoringEnabled", t.editor.monitoringEnabled],
            ] as Array<[keyof FormState, string]>
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-soft px-3 py-2.5 text-xs text-ink-2 transition-colors hover:border-line-strong hover:bg-soft-2"
            >
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => set(key, e.target.checked as FormState[typeof key])}
                className="size-4"
                style={{ accentColor: "var(--color-accent)" }}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={closeEditor}
            className="rounded-xl border border-line bg-soft px-4 py-2 text-xs font-medium text-ink-2 transition-colors hover:border-line-strong hover:bg-soft-2 hover:text-ink"
          >
            {t.actions.cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl border border-accent/50 bg-accent-soft px-5 py-2 text-xs font-semibold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-accent/70 hover:bg-accent/25 hover:shadow-[0_4px_20px_var(--color-accent-glow),inset_0_1px_0_rgba(255,255,255,0.12)] disabled:opacity-60"
          >
            {t.actions.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}
