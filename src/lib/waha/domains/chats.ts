import { serverEnv } from "@/lib/env/server";
import { requestWaha } from "@/lib/waha/http-client";
import { sendTextInputSchema, wahaConversationSchema, wahaMessageSchema } from "@/lib/waha/schemas";
import type { WahaConversation, WahaMessage } from "@/lib/waha/types";

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeConversationItem(item: unknown) {
  if (!item || typeof item !== "object") {
    return item;
  }

  const source = item as Record<string, unknown>;
  const avatarUrl =
    asString(source.avatarUrl) ??
    asString(source.avatar) ??
    asString(source.photo) ??
    asString(source.picture) ??
    asString(source.profilePictureUrl);
  const isPinned = asBoolean(source.isPinned) ?? asBoolean(source.pinned) ?? false;
  const isArchived = asBoolean(source.isArchived) ?? asBoolean(source.archived) ?? false;

  return {
    ...source,
    avatarUrl,
    isPinned,
    isArchived,
  };
}

function normalizeConversations(rawData: unknown): WahaConversation[] {
  const source = Array.isArray(rawData) ? rawData : [];
  const conversations = source
    .map((item) => wahaConversationSchema.safeParse(normalizeConversationItem(item)))
    .filter((result) => result.success)
    .map((result) => result.data);

  return conversations.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    const first = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
    const second = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
    return second - first;
  });
}

function normalizeMessages(rawData: unknown): WahaMessage[] {
  const source = Array.isArray(rawData) ? rawData : [];
  const messages = source
    .map((item) => wahaMessageSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

export const chatsDomain = {
  async list(): Promise<WahaConversation[]> {
    const response = await requestWaha({ path: "chats" });
    return normalizeConversations(response.body);
  },
  async messages(chatId: string, limit = 100): Promise<WahaMessage[]> {
    const response = await requestWaha({
      path: "messages",
      searchParams: {
        chatId,
        limit,
      },
    });
    return normalizeMessages(response.body);
  },
  async sendText(input: { chatId: string; text: string; session?: string }) {
    const parsed = sendTextInputSchema.parse(input);
    return requestWaha({
      path: "sendText",
      method: "POST",
      body: {
        ...parsed,
        session: parsed.session ?? serverEnv.WAHA_DEFAULT_SESSION,
      },
    });
  },
};
