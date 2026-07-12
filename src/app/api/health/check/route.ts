import { NextResponse } from "next/server";
import { checkAllServices } from "@/lib/server/checker";
import { serverMessages } from "@/lib/server/messages";

export const dynamic = "force-dynamic";

/** Run a full health check across all monitored services. */
export async function POST() {
  try {
    const snapshot = await checkAllServices();
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json(
      { error: serverMessages.errors.checkFailed },
      { status: 500 },
    );
  }
}
