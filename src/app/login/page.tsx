"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { t } from "@/locales/zh-CN";

const inputCls =
  "w-full rounded-xl border border-line-strong bg-well px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent/60 focus:bg-soft";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // focus via effect — autoFocus triggers a hydration mismatch warning
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auth disabled or already signed in → nothing to do here.
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((s: { enabled: boolean; authenticated: boolean }) => {
        if (!s.enabled || s.authenticated) window.location.replace("/");
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 204) {
        window.location.replace("/");
        return;
      }
      if (res.status === 429) {
        const body = (await res.json().catch(() => null)) as {
          retryAfterSeconds?: number;
        } | null;
        const minutes = Math.max(1, Math.ceil((body?.retryAfterSeconds ?? 900) / 60));
        setError(t.auth.errorTooManyAttempts(minutes));
      } else if (res.status === 401) {
        setError(t.auth.errorWrongPassword);
        setPassword("");
        inputRef.current?.focus();
      } else {
        setError(t.auth.errorNetwork);
      }
    } catch {
      setError(t.auth.errorNetwork);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="ambient" aria-hidden>
        <div className="ambient-glow" />
        <div className="ambient-blob ambient-blob--one" />
        <div className="ambient-blob ambient-blob--two" />
        <div className="ambient-blob ambient-blob--three" />
        <div className="ambient-grid" />
        <div className="ambient-noise" />
        <div className="ambient-vignette" />
      </div>

      <main className="relative z-10 flex min-h-dvh items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass module-panel w-full max-w-sm p-7 sm:p-8"
        >
          <div>
            <p className="section-kicker">{t.workspace.secureAccess}</p>
            <div className="mt-6 flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <ShieldCheck size={22} aria-hidden />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-[-0.022em]">{t.app.title}</h1>
            <p className="mt-1 text-xs text-ink-3">{t.auth.loginSubtitle}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="access-password" className="mb-1.5 block text-xs font-medium text-ink-2">
                {t.auth.passwordLabel}
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="access-password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.passwordPlaceholder}
                  autoComplete="current-password"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 touch-manipulation text-ink-3 transition-colors hover:text-ink [-webkit-tap-highlight-color:transparent]"
                >
                  {visible ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-crit/35 bg-crit/10 px-3 py-2.5 text-xs font-medium text-crit">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!password || submitting}
              className="primary-action flex w-full items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60"
            >
              <LockKeyhole size={15} aria-hidden />
              {submitting ? t.auth.submitting : t.auth.submit}
            </button>
          </form>
        </motion.div>
      </main>
    </>
  );
}
