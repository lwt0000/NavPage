/**
 * POST /api/auth/login — exchanges the access password for a session cookie.
 * Per-IP rate limiting (5 failures / 15 min) and constant-time comparison;
 * the plaintext password never leaves this handler.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  authEnabled,
  COOKIE_NAME,
  createSessionToken,
  sessionMaxAgeSeconds,
} from "@/lib/server/auth";

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;

interface AttemptRecord {
  failures: number;
  resetAt: number;
}

const g = globalThis as unknown as { __wccLoginAttempts?: Map<string, AttemptRecord> };
const attempts = (g.__wccLoginAttempts ??= new Map());

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

function passwordsMatch(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.json({ error: "auth-disabled" }, { status: 409 });
  }

  const key = clientKey(req);
  const now = Date.now();
  const record = attempts.get(key);
  if (record && now < record.resetAt && record.failures >= MAX_FAILURES) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "too-many-attempts", retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(retryAfterSeconds) } },
    );
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length === 0 || password.length > 256) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  if (!passwordsMatch(password, process.env.DASHBOARD_PASSWORD as string)) {
    const next: AttemptRecord =
      record && now < record.resetAt
        ? { failures: record.failures + 1, resetAt: record.resetAt }
        : { failures: 1, resetAt: now + WINDOW_MS };
    attempts.set(key, next);
    return NextResponse.json({ error: "invalid-password" }, { status: 401 });
  }

  attempts.delete(key);
  const secure =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: sessionMaxAgeSeconds(),
  });
  return res;
}
