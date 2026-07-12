import { NextResponse } from "next/server";
import { checkOneService } from "@/lib/server/checker";
import { serverMessages } from "@/lib/server/messages";

export const dynamic = "force-dynamic";

/** Run a health check for a single service. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const { serviceId } = await params;
  const snapshot = await checkOneService(serviceId);
  if (!snapshot) {
    return NextResponse.json(
      { error: serverMessages.errors.notFound },
      { status: 404 },
    );
  }
  return NextResponse.json(snapshot);
}
