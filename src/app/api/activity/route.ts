import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ activity: getStore().activity });
}
