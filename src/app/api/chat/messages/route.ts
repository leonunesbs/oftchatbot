import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { chatsDomain } from "@/lib/waha/domains/chats";
import { WahaHttpError } from "@/lib/waha/http-client";

const fallbackMessages = [
  {
    id: "demo-message-1",
    chatId: "5511999999999@c.us",
    fromMe: false,
    text: "Seu painel de chat está pronto. Conecte o WAHA para dados reais.",
    timestamp: Date.now(),
  },
];

export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chatId");
  const limit = Math.min(100, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "40", 10) || 40));
  const offset = Math.max(0, Number.parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10) || 0);
  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  try {
    const messages = await chatsDomain.messages(chatId, { limit, offset });
    return NextResponse.json({
      messages,
      limit,
      offset,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    if (error instanceof WahaHttpError) {
      return NextResponse.json(
        {
          messages: offset === 0 ? fallbackMessages.map((message) => ({ ...message, chatId })) : [],
          limit,
          offset,
          hasMore: false,
          warning: "WAHA is unavailable. Showing fallback messages.",
          details: error.responseBody,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        messages: offset === 0 ? fallbackMessages.map((message) => ({ ...message, chatId })) : [],
        limit,
        offset,
        hasMore: false,
      },
      { status: 200 }
    );
  }
}
