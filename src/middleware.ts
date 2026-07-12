/**
 * Access gate for the whole dashboard. Active only when DASHBOARD_PASSWORD
 * is set: pages redirect to /login, API routes answer 401. The login page
 * and the auth endpoints themselves stay reachable so signing in is possible.
 */
import { NextRequest, NextResponse } from "next/server";
import { authEnabled, COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";

const PUBLIC_API = new Set(["/api/auth/login", "/api/auth/status"]);

export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const authed = token ? await verifySessionToken(token) : false;

  if (pathname === "/login") {
    if (!authed) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (PUBLIC_API.has(pathname) || authed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // everything except Next.js static assets and common public files
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|pdf|woff2?)$).*)",
  ],
};
