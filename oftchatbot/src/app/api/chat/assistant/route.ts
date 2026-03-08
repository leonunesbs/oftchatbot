import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { assistantModes } from "@/lib/assistants/types";
import { contactProfileStore } from "@/lib/contact-profile/store";

export const runtime = "nodejs";

const updateAssistantSchema = z.object({
  assistant: z.enum(assistantModes),
  chatId: z.string().min(5).optional(),
});

export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chatId");
  const assistant = chatId
    ? contactProfileStore.getAssistantForChat(chatId)
    : contactProfileStore.getActiveAssistant();
  return NextResponse.json({ assistant });
}

export async function PUT(request: NextRequest) {
  const payload = await request.json();
  const parsed = updateAssistantSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const assistant = parsed.data.chatId
    ? contactProfileStore.setAssistantForChat(
        parsed.data.chatId,
        parsed.data.assistant,
      )
    : contactProfileStore.setActiveAssistant(parsed.data.assistant);
  return NextResponse.json({ assistant });
}
