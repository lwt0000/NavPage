import { NextResponse } from "next/server";
import { serverMessages } from "@/lib/server/messages";
import { buildSnapshot, reorderServices } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: serverMessages.errors.badRequest }, { status: 400 });
  }
  if (
    !Array.isArray(body.ids) ||
    !body.ids.every((id) => typeof id === "string")
  ) {
    return NextResponse.json({ error: serverMessages.errors.badRequest }, { status: 400 });
  }
  reorderServices(body.ids);
  return NextResponse.json({ services: buildSnapshot().services });
}
