import { NextResponse } from "next/server";

import { api } from "@convex/_generated/api";
import { getConvexHttpClient } from "@/lib/convex-server";
import { requireMemberApiAccess } from "@/lib/access";

export async function GET() {
  try {
    await requireMemberApiAccess();
    const client = getConvexHttpClient();
    const eventTypes = await client.query(api.appointments.getActiveBookingEventTypes, {});
    return NextResponse.json({ ok: true, eventTypes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao buscar eventos de atendimento.";
    const status = message === "Not authenticated" ? 401 : message === "Not authorized" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
