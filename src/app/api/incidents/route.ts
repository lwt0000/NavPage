import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ incidents: buildSnapshot().incidents });
}
