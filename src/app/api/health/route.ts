import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** Current snapshot without running new probes (fast first paint). */
export async function GET() {
  return NextResponse.json(buildSnapshot());
}
