/**
 * GET /api/auth/status — whether password protection is enabled and whether
 * the caller holds a valid session. Public: it reveals nothing beyond the
 * fact that a login page exists.
 */
import { NextRequest, NextResponse } from "next/server";
import { authEnabled, COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const enabled = authEnabled();
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const authenticated = !enabled || (token ? await verifySessionToken(token) : false);
  return NextResponse.json({ enabled, authenticated });
}
