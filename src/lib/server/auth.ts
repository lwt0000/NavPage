/**
 * Cookie-session helpers shared by the edge middleware and Node API routes.
 * Web Crypto only — no node:crypto — so the same module runs in both runtimes.
 *
 * Auth is enabled by setting the DASHBOARD_PASSWORD environment variable.
 * Sessions are stateless HMAC tokens of the form "<expiryMs>.<base64url sig>";
 * the signing key is derived from AUTH_SECRET (or, if unset, from the
 * password itself), so rotating either invalidates every session.
 */

export const COOKIE_NAME = "wcc_session";

const DEFAULT_SESSION_HOURS = 168; // 7 days

export function authEnabled(): boolean {
  return Boolean(process.env.DASHBOARD_PASSWORD);
}

export function sessionMaxAgeSeconds(): number {
  const hours = Number(process.env.AUTH_SESSION_HOURS);
  const valid = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_SESSION_HOURS;
  return Math.round(valid * 3600);
}

const encoder = new TextEncoder();

async function hmacKey(usage: KeyUsage): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET || `wcc:${process.env.DASHBOARD_PASSWORD ?? ""}`;
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

function toBase64Url(buf: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + sessionMaxAgeSeconds() * 1000;
  const key = await hmacKey("sign");
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`wcc-session:${exp}`));
  return `${exp}.${toBase64Url(sig)}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const sig = fromBase64Url(token.slice(dot + 1));
  if (!sig) return false;
  const key = await hmacKey("verify");
  // subtle.verify performs a constant-time comparison internally
  return crypto.subtle.verify(
    "HMAC",
    key,
    sig as unknown as ArrayBuffer,
    encoder.encode(`wcc-session:${exp}`),
  );
}
