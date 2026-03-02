import { NextResponse } from "next/server";

import { contactProfileStore } from "@/lib/contact-profile/store";
import { chatsDomain } from "@/lib/waha/domains/chats";
import type { WahaConversation } from "@/lib/waha/types";
import { WahaHttpError } from "@/lib/waha/http-client";

const fallbackConversations = [
  {
    id: "5511999999999@c.us",
    name: "WAHA Demo",
    unreadCount: 0,
    preview: "Conecte o WAHA para ver suas conversas reais.",
    lastMessageAt: new Date().toISOString(),
    isPinned: true,
    isArchived: false,
  },
];

function withFunnelStage(conversations: WahaConversation[]) {
  return conversations.map((conversation) => {
    const profile = contactProfileStore.get(conversation.id, conversation.name);
    return {
      ...conversation,
      funnelStage: profile.funnelStage,
    };
  });
}

export async function GET(request: Request) {
  const limitParam = request.url ? new URL(request.url).searchParams.get("limit") : null;
  const offsetParam = request.url ? new URL(request.url).searchParams.get("offset") : null;
  const limit = Math.min(100, Math.max(1, Number.parseInt(limitParam ?? "30", 10) || 30));
  const offset = Math.max(0, Number.parseInt(offsetParam ?? "0", 10) || 0);

  try {
    const conversations = withFunnelStage(
      await chatsDomain.list({ limit, offset }),
    );
    return NextResponse.json({
      conversations,
      limit,
      offset,
      hasMore: conversations.length === limit,
    });
  } catch (error) {
    if (error instanceof WahaHttpError) {
      return NextResponse.json(
        {
          conversations:
            offset === 0
              ? withFunnelStage(fallbackConversations)
              : [],
          limit,
          offset,
          hasMore: false,
          warning: "WAHA is unavailable. Showing fallback data.",
          details: error.responseBody,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        conversations:
          offset === 0 ? withFunnelStage(fallbackConversations) : [],
        limit,
        offset,
        hasMore: false,
      },
      { status: 200 }
    );
  }
}
