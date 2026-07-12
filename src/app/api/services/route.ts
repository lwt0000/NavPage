import { NextResponse } from "next/server";
import { serverMessages } from "@/lib/server/messages";
import { buildSnapshot, createService } from "@/lib/server/store";
import type { ServiceInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ services: buildSnapshot().services });
}

export async function POST(req: Request) {
  let input: ServiceInput;
  try {
    input = (await req.json()) as ServiceInput;
  } catch {
    return NextResponse.json({ error: serverMessages.errors.badRequest }, { status: 400 });
  }
  const result = createService(input);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ service: result.service }, { status: 201 });
}
