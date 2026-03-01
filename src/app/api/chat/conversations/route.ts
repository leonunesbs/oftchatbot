import { NextResponse } from "next/server";

import { chatsDomain } from "@/lib/waha/domains/chats";
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

export async function GET() {
  try {
    const conversations = await chatsDomain.list();
    return NextResponse.json({ conversations });
  } catch (error) {
    if (error instanceof WahaHttpError) {
      return NextResponse.json(
        {
          conversations: fallbackConversations,
          warning: "WAHA is unavailable. Showing fallback data.",
          details: error.responseBody,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ conversations: fallbackConversations }, { status: 200 });
  }
}
