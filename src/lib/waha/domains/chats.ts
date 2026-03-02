import { serverEnv } from "@/lib/env/server";
import { requestWaha } from "@/lib/waha/http-client";
import { sendTextInputSchema, wahaConversationSchema, wahaMessageSchema } from "@/lib/waha/schemas";
import type { WahaConversation, WahaMessage } from "@/lib/waha/types";

const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = 4;
const MIN_SEND_GAP_MS = 30_000;
const MAX_SEND_GAP_MS = 60_000;
const MIN_TYPING_MS = 1_500;
const MAX_TYPING_MS = 15_000;

type ChatRateState = {
  windowStartedAt: number;
  sentInWindow: number;
  lastSentAt?: number;
};

const chatRateState = new Map<string, ChatRateState>();

export class WahaSendPolicyError extends Error {
  status: number;

  constructor(message: string, status = 429) {
    super(message);
    this.name = "WahaSendPolicyError";
    this.status = status;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomBetween(minInclusive: number, maxInclusive: number) {
  if (maxInclusive <= minInclusive) {
    return minInclusive;
  }
  const span = maxInclusive - minInclusive + 1;
  return Math.floor(Math.random() * span) + minInclusive;
}

function getRateStateKey(session: string, chatId: string) {
  return `${session}:${chatId}`;
}

function normalizeRateState(now: number, state?: ChatRateState): ChatRateState {
  if (!state) {
    return {
      windowStartedAt: now,
      sentInWindow: 0,
    };
  }

  if (now - state.windowStartedAt >= RATE_WINDOW_MS) {
    return {
      windowStartedAt: now,
      sentInWindow: 0,
      lastSentAt: state.lastSentAt,
    };
  }

  return state;
}

function estimateTypingDelayMs(text: string) {
  const cleanLength = text.trim().length;
  const base = cleanLength * 55;
  const withBounds = Math.min(MAX_TYPING_MS, Math.max(MIN_TYPING_MS, base));
  const jitter = randomBetween(200, 1_200);
  return Math.min(MAX_TYPING_MS, withBounds + jitter);
}

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
  async list(
    options?: {
      limit?: number;
      offset?: number;
      session?: string;
    }
  ): Promise<WahaConversation[]> {
    const session = options?.session ?? serverEnv.WAHA_DEFAULT_SESSION;
    const limit = Math.max(1, options?.limit ?? 100);
    const offset = Math.max(0, options?.offset ?? 0);
    const response = await requestWaha({
      path: `${session}/chats/overview`,
      searchParams: {
        limit,
        offset,
      },
    });
    return normalizeConversations(response.body);
  },
  async messages(
    chatId: string,
    options?: {
      limit?: number;
      offset?: number;
      session?: string;
    }
  ): Promise<WahaMessage[]> {
    const session = options?.session ?? serverEnv.WAHA_DEFAULT_SESSION;
    const limit = Math.max(1, options?.limit ?? 100);
    const offset = Math.max(0, options?.offset ?? 0);
    const response = await requestWaha({
      path: `${session}/chats/${encodeURIComponent(chatId)}/messages`,
      searchParams: {
        limit,
        offset,
        downloadMedia: false,
      },
    });
    return normalizeMessages(response.body, chatId);
  },
  async sendText(input: { chatId: string; text: string; session?: string }, options?: { allowBotFollowUp?: boolean }) {
    const parsed = sendTextInputSchema.parse(input);
    const session = parsed.session ?? serverEnv.WAHA_DEFAULT_SESSION;
    const rateStateKey = getRateStateKey(session, parsed.chatId);
    const now = Date.now();
    const state = normalizeRateState(now, chatRateState.get(rateStateKey));
    chatRateState.set(rateStateKey, state);

    const recentMessages = await this.messages(parsed.chatId, { limit: 100, offset: 0, session });
    const latestIncoming = recentMessages.filter((message) => !message.fromMe).at(-1);
    const latestOutgoing = recentMessages.filter((message) => message.fromMe).at(-1);

    if (!latestIncoming) {
      throw new WahaSendPolicyError(
        "Envio bloqueado por segurança: o contato ainda não iniciou conversa neste chat.",
        409
      );
    }

    const incomingIsRecent = now - latestIncoming.timestamp <= REPLY_WINDOW_MS;
    if (!incomingIsRecent) {
      throw new WahaSendPolicyError(
        "Envio bloqueado por segurança: a última mensagem recebida está fora da janela de resposta.",
        409
      );
    }

    if (latestOutgoing && latestOutgoing.timestamp >= latestIncoming.timestamp) {
      if (!options?.allowBotFollowUp) {
        throw new WahaSendPolicyError(
          "Envio bloqueado por segurança: aguarde uma nova mensagem do contato antes de responder novamente.",
          409
        );
      }

      // Allow only one internal follow-up after the first reply in the same turn.
      const outgoingAfterLatestIncoming = recentMessages.filter(
        (message) => message.fromMe && message.timestamp >= latestIncoming.timestamp
      );
      if (outgoingAfterLatestIncoming.length >= 2) {
        throw new WahaSendPolicyError(
          "Envio bloqueado por segurança: limite de follow-up excedido para esta mensagem recebida.",
          409
        );
      }
    }

    if (state.sentInWindow >= MAX_MESSAGES_PER_WINDOW) {
      throw new WahaSendPolicyError(
        "Limite anti-bloqueio atingido: no máximo 4 mensagens por hora para este contato.",
        429
      );
    }

    if (!options?.allowBotFollowUp && typeof state.lastSentAt === "number") {
      const elapsed = now - state.lastSentAt;
      const requiredGap = randomBetween(MIN_SEND_GAP_MS, MAX_SEND_GAP_MS);
      if (elapsed < requiredGap) {
        await sleep(requiredGap - elapsed);
      }
    }

    const interactionBody = {
      chatId: parsed.chatId,
      session,
    };

    await requestWaha({
      path: "sendSeen",
      method: "POST",
      body: interactionBody,
    }).catch((error) => {
      console.warn("[WAHA anti-block] sendSeen failed", error);
    });

    await requestWaha({
      path: "startTyping",
      method: "POST",
      body: interactionBody,
    }).catch((error) => {
      console.warn("[WAHA anti-block] startTyping failed", error);
    });

    const typingDelayMs = estimateTypingDelayMs(parsed.text);
    await sleep(typingDelayMs);

    await requestWaha({
      path: "stopTyping",
      method: "POST",
      body: interactionBody,
    }).catch((error) => {
      console.warn("[WAHA anti-block] stopTyping failed", error);
    });

    const response = await requestWaha({
      path: "sendText",
      method: "POST",
      body: {
        ...parsed,
        session,
      },
    });

    const sentAt = Date.now();
    chatRateState.set(rateStateKey, {
      ...state,
      sentInWindow: state.sentInWindow + 1,
      lastSentAt: sentAt,
    });

    return response;
  },
};
