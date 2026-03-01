import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { funnelStages } from "@/lib/contact-profile/types";
import { contactProfileStore } from "@/lib/contact-profile/store";

export const runtime = "nodejs";

const updateContactProfileSchema = z.object({
  chatId: z.string().min(5),
  contactName: z.string().trim().optional(),
  funnelStage: z.enum(funnelStages),
  notes: z.string().max(5000).default(""),
});

export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chatId");
  const contactName = request.nextUrl.searchParams.get("contactName") ?? undefined;

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const profile = contactProfileStore.get(chatId, contactName);
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const payload = await request.json();
  const parsed = updateContactProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const profile = contactProfileStore.upsert(parsed.data);
  return NextResponse.json({ profile });
}
