/** POST /api/auth/logout — clears the session cookie. */
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/server/auth";

export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
