import { NextResponse } from "next/server";
import { serverMessages } from "@/lib/server/messages";
import { deleteService, updateService } from "@/lib/server/store";
import type { DashboardService } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let patch: Partial<DashboardService>;
  try {
    patch = (await req.json()) as Partial<DashboardService>;
  } catch {
    return NextResponse.json({ error: serverMessages.errors.badRequest }, { status: 400 });
  }
  const result = updateService(id, patch);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ service: result.service });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = deleteService(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
