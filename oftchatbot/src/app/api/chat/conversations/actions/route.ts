import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { contactProfileStore } from "@/lib/contact-profile/store";
import { funnelStages } from "@/lib/contact-profile/types";
import { serverEnv } from "@/lib/env/server";
import { WahaHttpError, requestWaha } from "@/lib/waha/http-client";

const conversationActionSchema = z.object({
  chatId: z.string().min(5),
  contactName: z.string().trim().optional(),
  action: z.enum(["mark-unread", "archive", "advance-funnel"]),
});

function getNextFunnelStage(current: (typeof funnelStages)[number]) {
  const index = funnelStages.indexOf(current);
  if (index < 0 || index >= funnelStages.length - 1) {
    return current;
  }
  return funnelStages[index + 1] ?? current;
}

async function tryWahaCandidates(
  candidates: Array<{
    path: string;
    method?: "POST" | "PUT" | "PATCH";
    body?: unknown;
  }>,
) {
  let lastHttpError: WahaHttpError | null = null;

  for (const candidate of candidates) {
    try {
      await requestWaha({
        path: candidate.path,
        method: candidate.method ?? "POST",
        body: candidate.body,
      });
      return;
    } catch (error) {
      if (error instanceof WahaHttpError) {
        lastHttpError = error;
        continue;
      }
      throw error;
    }
  }

  if (lastHttpError) {
    throw lastHttpError;
  }
  throw new Error("No WAHA candidate succeeded");
}

async function markConversationAsUnread(chatId: string) {
  const encodedChatId = encodeURIComponent(chatId);
  const session = serverEnv.WAHA_DEFAULT_SESSION;

  await tryWahaCandidates([
    { path: `${session}/chats/${encodedChatId}/unread` },
    { path: `chats/${encodedChatId}/unread` },
    { path: `${session}/chats/${encodedChatId}/markUnread` },
    { path: `chats/${encodedChatId}/markUnread` },
    { path: "chats/unread", body: { chatId, session } },
    { path: "chats/markUnread", body: { chatId, session } },
  ]);
}

async function archiveConversation(chatId: string) {
  const encodedChatId = encodeURIComponent(chatId);
  const session = serverEnv.WAHA_DEFAULT_SESSION;

  await tryWahaCandidates([
    { path: `${session}/chats/${encodedChatId}/archive` },
    { path: `chats/${encodedChatId}/archive` },
    { path: "chats/archive", body: { chatId, session } },
  ]);
}

function advanceConversationFunnel(chatId: string, contactName?: string) {
  const currentProfile = contactProfileStore.get(chatId, contactName);
  const nextFunnelStage = getNextFunnelStage(currentProfile.funnelStage);

  const profile = contactProfileStore.upsert({
    chatId,
    contactName: currentProfile.contactName,
    funnelStage: nextFunnelStage,
    notes: currentProfile.notes,
  });

  return profile;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = conversationActionSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { action, chatId, contactName } = parsed.data;

    if (action === "mark-unread") {
      await markConversationAsUnread(chatId);
      return NextResponse.json({ ok: true });
    }

    if (action === "archive") {
      await archiveConversation(chatId);
      return NextResponse.json({ ok: true });
    }

    const profile = advanceConversationFunnel(chatId, contactName);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    if (error instanceof WahaHttpError) {
      return NextResponse.json(
        {
          error: "Failed to run WAHA action",
          details: error.responseBody,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to run conversation action",
      },
      { status: 500 },
    );
  }
}
