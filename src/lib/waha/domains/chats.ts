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

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toTimestamp(value: unknown) {
  const numeric = asNumber(value);
  if (typeof numeric === "number") {
    // WAHA can return unix timestamps in seconds.
    return numeric < 1_000_000_000_000 ? Math.round(numeric * 1000) : Math.round(numeric);
  }

  if (typeof value === "string") {
    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }
  }

  return Date.now();
}

function toIsoDate(value: unknown) {
  const timestamp = toTimestamp(value);
  return new Date(timestamp).toISOString();
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function normalizeConversationItem(item: unknown) {
  if (!item || typeof item !== "object") {
    return item;
  }

  const source = item as Record<string, unknown>;
  const nestedChat = asRecord(source._chat);
  const lastMessage = asRecord(source.lastMessage);
  const picture = asRecord(source.picture);

  const avatarUrl =
    asString(source.avatarUrl) ??
    asString(source.avatar) ??
    asString(source.photo) ??
    asString(source.picture) ??
    asString(picture?.url) ??
    asString(source.profilePictureUrl) ??
    asString(source.url);
  const isPinned =
    asBoolean(source.isPinned) ?? asBoolean(source.pinned) ?? asBoolean(nestedChat?.isPinned) ?? asBoolean(nestedChat?.pinned) ?? false;
  const isArchived =
    asBoolean(source.isArchived) ??
    asBoolean(source.archived) ??
    asBoolean(nestedChat?.isArchived) ??
    asBoolean(nestedChat?.archived) ??
    false;

  const unreadCount =
    asNumber(source.unreadCount) ??
    asNumber(source.unread) ??
    asNumber(nestedChat?.unreadCount) ??
    asNumber(nestedChat?.unread) ??
    0;
  const id = asString(source.id);
  const name = asString(source.name) ?? asString(nestedChat?.name) ?? "Unknown contact";

  const preview = asString(source.preview) ?? asString(source.lastMessagePreview) ?? asString(lastMessage?.body) ?? asString(lastMessage?.text);
  const lastMessageAt = asString(source.lastMessageAt) ?? (lastMessage ? toIsoDate(lastMessage.timestamp) : undefined);

  return {
    ...source,
    id,
    name,
    unreadCount: Math.max(0, Math.floor(unreadCount)),
    preview,
    lastMessageAt,
    avatarUrl,
    isPinned,
    isArchived,
  };
}

function normalizeConversations(rawData: unknown): WahaConversation[] {
  const source =
    Array.isArray(rawData) ? rawData : asRecord(rawData) && Array.isArray(asRecord(rawData)?.chats) ? (asRecord(rawData)?.chats as unknown[]) : [];
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

function normalizeMessageItem(item: unknown, chatId: string) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const source = item as Record<string, unknown>;
  const nestedData = asRecord(source._data);
  const nestedId = asRecord(nestedData?.id);

  const id = asString(source.id) ?? asString(nestedId?._serialized) ?? asString(nestedId?.id);
  if (!id) {
    return null;
  }

  const text = asString(source.text) ?? asString(source.body) ?? asString(source.caption) ?? "";
  const fromMe = asBoolean(source.fromMe) ?? false;
  const resolvedChatId = asString(source.chatId) ?? (fromMe ? asString(source.to) : asString(source.from)) ?? chatId;

  return {
    id,
    chatId: resolvedChatId,
    fromMe,
    text,
    timestamp: toTimestamp(source.timestamp),
  };
}

function normalizeMessages(rawData: unknown, chatId: string): WahaMessage[] {
  const source =
    Array.isArray(rawData)
      ? rawData
      : asRecord(rawData) && Array.isArray(asRecord(rawData)?.messages)
        ? (asRecord(rawData)?.messages as unknown[])
        : [];

  const messages = source
    .map((item) => normalizeMessageItem(item, chatId))
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map((item) => wahaMessageSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

export const chatsDomain = {
  async list(session = serverEnv.WAHA_DEFAULT_SESSION): Promise<WahaConversation[]> {
    const response = await requestWaha({
      path: `${session}/chats/overview`,
      searchParams: {
        limit: 100,
        offset: 0,
      },
    });
    return normalizeConversations(response.body);
  },
  async messages(chatId: string, limit = 100, session = serverEnv.WAHA_DEFAULT_SESSION): Promise<WahaMessage[]> {
    const response = await requestWaha({
      path: `${session}/chats/${encodeURIComponent(chatId)}/messages`,
      searchParams: {
        limit,
        downloadMedia: false,
      },
    });
    return normalizeMessages(response.body, chatId);
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
