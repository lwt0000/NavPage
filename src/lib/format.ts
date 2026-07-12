/** zh-CN date, time and number formatting helpers. */
import { t } from "@/locales/zh-CN";

export const locale = "zh-CN";

const fullDateFmt = new Intl.DateTimeFormat(locale, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "long" });

const clockFmt = new Intl.DateTimeFormat(locale, {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dayPeriodFmt = new Intl.DateTimeFormat(locale, {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateTimeFmt = new Intl.DateTimeFormat(locale, {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 2026年7月11日 */
export function formatFullDate(d: Date): string {
  return fullDateFmt.format(d);
}

/** 星期五 */
export function formatWeekday(d: Date): string {
  return weekdayFmt.format(d);
}

/** 21:35 */
export function formatClockTime(d: Date): string {
  return clockFmt.format(d);
}

/** 晚上 9:35 — adds a space between the day period and the digits */
export function formatDayPeriodTime(d: Date): string {
  return dayPeriodFmt
    .format(d)
    .replace(/^(凌晨|清晨|早上|上午|中午|下午|傍晚|晚上|夜间)\s*/, "$1 ");
}

/** 7月11日 21:35 */
export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** 刚刚 / 30秒前 / 5分钟前 / … */
export function formatRelative(iso: string | null, now = Date.now()): string {
  if (!iso) return t.time.never;
  const diff = Math.max(0, now - new Date(iso).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return t.time.justNow;
  if (sec < 60) return t.time.secondsAgo(sec);
  const min = Math.floor(sec / 60);
  if (min < 60) return t.time.minutesAgo(min);
  const hr = Math.floor(min / 60);
  if (hr < 24) return t.time.hoursAgo(hr);
  const day = Math.floor(hr / 24);
  if (day < 7) return t.time.daysAgo(day);
  return formatDateTime(iso);
}

/** 42 毫秒 / — */
export function formatLatency(ms: number | null): string {
  if (ms == null) return "—";
  return `${Math.round(ms)} ${t.metrics.ms}`;
}

/** 96% / 99.9% */
export function formatPercent(v: number, digits = 0): string {
  const rounded = v.toFixed(digits);
  // trim trailing zeros for e.g. 99.90 → 99.9
  const trimmed = digits > 0 ? String(parseFloat(rounded)) : rounded;
  return `${trimmed}%`;
}
