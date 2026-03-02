"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { ContactProfile, FunnelStage } from "@/lib/contact-profile/types";
import { funnelStageLabels, funnelStages } from "@/lib/contact-profile/types";
import type {
  WahaConversation,
  WahaMessage,
  WahaSession,
} from "@/lib/waha/types";

import { AppSidebar } from "@/components/app-sidebar";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ConversationsResponse = {
  conversations: WahaConversation[];
  hasMore?: boolean;
};

type MessagesResponse = {
  messages: WahaMessage[];
  hasMore?: boolean;
};

type ContactProfileResponse = {
  profile: ContactProfile;
};

type ConversationAction = "mark-unread" | "archive" | "advance-funnel";
type ConversationActionResponse = {
  profile?: ContactProfile;
};

const CONVERSATIONS_PAGE_SIZE = 30;
const MESSAGES_PAGE_SIZE = 40;
const CONVERSATIONS_REFRESH_INTERVAL_MS = 30_000;
const MESSAGES_REFRESH_INTERVAL_MS = 15_000;
const BACKGROUND_REFRESH_INTERVAL_MS = 60_000;
const REALTIME_RECENT_WINDOW_MS = 20_000;
const REALTIME_CONVERSATIONS_REFRESH_THROTTLE_MS = 2_000;
const OPTIMISTIC_MESSAGE_ID_PREFIX = "optimistic:";
const MESSAGE_DUPLICATE_WINDOW_MS = 15_000;

function mergeUniqueById<T extends { id: string }>(
  current: T[],
  incoming: T[],
) {
  const merged = new Map<string, T>();
  for (const item of current) {
    merged.set(item.id, item);
  }
  for (const item of incoming) {
    merged.set(item.id, item);
  }
  return Array.from(merged.values());
}

function mergeMessagesChronologically(
  current: WahaMessage[],
  incoming: WahaMessage[],
) {
  return dedupeMessages(mergeUniqueById(current, incoming)).sort(
    (a, b) => a.timestamp - b.timestamp,
  );
}

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
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
    return numeric < 1_000_000_000_000
      ? Math.round(numeric * 1000)
      : Math.round(numeric);
  }
  if (typeof value === "string") {
    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }
  }
  return Date.now();
}

function isOptimisticMessageId(id: string) {
  return id.startsWith(OPTIMISTIC_MESSAGE_ID_PREFIX);
}

function isLikelyDuplicateMessage(first: WahaMessage, second: WahaMessage) {
  if (first.chatId !== second.chatId || first.fromMe !== second.fromMe) {
    return false;
  }
  if (first.text.trim() !== second.text.trim()) {
    return false;
  }
  return (
    Math.abs(first.timestamp - second.timestamp) <= MESSAGE_DUPLICATE_WINDOW_MS
  );
}

function dedupeMessages(messages: WahaMessage[]) {
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  const deduped: WahaMessage[] = [];

  for (const next of sorted) {
    const existingIndex = deduped.findIndex(
      (existing) =>
        existing.id === next.id || isLikelyDuplicateMessage(existing, next),
    );

    if (existingIndex === -1) {
      deduped.push(next);
      continue;
    }

    const existing = deduped[existingIndex];
    if (!existing) {
      deduped.push(next);
      continue;
    }
    const existingIsOptimistic = isOptimisticMessageId(existing.id);
    const nextIsOptimistic = isOptimisticMessageId(next.id);

    if (existingIsOptimistic && !nextIsOptimistic) {
      deduped[existingIndex] = next;
    }
  }

  return deduped;
}

function extractMessageId(candidate: Record<string, unknown>) {
  const nestedData = asRecord(candidate._data);
  const nestedId = asRecord(nestedData?.id);
  return (
    asString(candidate.id) ??
    asString(nestedId?._serialized) ??
    asString(nestedId?.id)
  );
}

function normalizeMessageFromUnknown(
  rawMessage: unknown,
  fallback: { chatId: string; fromMe: boolean; text: string },
) {
  const record = asRecord(rawMessage);
  if (!record) {
    return null;
  }

  const messageId = extractMessageId(record);
  const fromMe = asBoolean(record.fromMe) ?? fallback.fromMe;
  const text =
    asString(record.body) ??
    asString(record.text) ??
    asString(record.caption) ??
    fallback.text;
  const chatId =
    asString(record.chatId) ??
    (fromMe ? asString(record.to) : asString(record.from)) ??
    fallback.chatId;

  if (!messageId || !text) {
    return null;
  }

  return {
    id: messageId,
    chatId,
    fromMe,
    text,
    timestamp: toTimestamp(record.timestamp),
  } satisfies WahaMessage;
}

function sortConversationsByPriority(items: WahaConversation[]) {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    const first = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
    const second = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
    return second - first;
  });
}

function getNextFunnelStage(stage: FunnelStage) {
  const currentIndex = funnelStages.indexOf(stage);
  if (currentIndex < 0 || currentIndex >= funnelStages.length - 1) {
    return stage;
  }
  return funnelStages[currentIndex + 1] ?? stage;
}

function getContactInitials(name?: string) {
  if (!name) {
    return "CT";
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "CT";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Page() {
  const [session, setSession] = React.useState<WahaSession | null>(null);
  const [conversations, setConversations] = React.useState<WahaConversation[]>(
    [],
  );
  const [selectedChatId, setSelectedChatId] = React.useState<
    string | undefined
  >();
  const [messages, setMessages] = React.useState<WahaMessage[]>([]);
  const [contactProfile, setContactProfile] =
    React.useState<ContactProfile | null>(null);
  const [notesDraft, setNotesDraft] = React.useState("");
  const [funnelStageDraft, setFunnelStageDraft] =
    React.useState<FunnelStage>("primeiro-contato");
  const [isLoadingConversations, setIsLoadingConversations] =
    React.useState(true);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] =
    React.useState(false);
  const [hasMoreConversations, setHasMoreConversations] = React.useState(true);
  const [conversationsOffset, setConversationsOffset] = React.useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] =
    React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(false);
  const [messagesOffset, setMessagesOffset] = React.useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [lastSyncAt, setLastSyncAt] = React.useState<Date | null>(null);
  const [pendingConversationActions, setPendingConversationActions] =
    React.useState<Record<string, Partial<Record<ConversationAction, boolean>>>>(
      {},
    );
  const activeMessagesChatRef = React.useRef<string | null>(null);
  const conversationsRequestRef = React.useRef(0);
  const messagesRequestRef = React.useRef(0);
  const isRefreshingConversationsRef = React.useRef(false);
  const isRefreshingMessagesRef = React.useRef(false);
  const isPageVisibleRef = React.useRef(true);
  const isRealtimeConnectedRef = React.useRef(false);
  const lastRealtimeEventAtRef = React.useRef(0);
  const lastRealtimeConversationRefreshAtRef = React.useRef(0);

  const activeConversation = React.useMemo(
    () =>
      conversations.find((conversation) => conversation.id === selectedChatId),
    [conversations, selectedChatId],
  );
  async function loadSession() {
    const response = await fetch("/api/chat/session", { cache: "no-store" });

    if (!response.ok) {
      setSession(null);
      return;
    }

    const rawBody = await response.text();
    if (!rawBody) {
      setSession(null);
      return;
    }

    try {
      const data = JSON.parse(rawBody) as { session?: WahaSession | null };
      setSession(data.session ?? null);
    } catch {
      setSession(null);
    }
  }

  async function loadConversations(options?: { append?: boolean }) {
    const append = options?.append ?? false;
    if (
      append &&
      (isLoadingMoreConversations ||
        isLoadingConversations ||
        !hasMoreConversations)
    ) {
      return;
    }

    if (append) {
      setIsLoadingMoreConversations(true);
    } else {
      setIsLoadingConversations(true);
      setIsLoadingMoreConversations(false);
      setConversationsOffset(0);
      setHasMoreConversations(true);
    }

    const requestId = conversationsRequestRef.current + 1;
    conversationsRequestRef.current = requestId;
    const offset = append ? conversationsOffset : 0;
    try {
      const response = await fetch(
        `/api/chat/conversations?limit=${CONVERSATIONS_PAGE_SIZE}&offset=${offset}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as ConversationsResponse;
      if (conversationsRequestRef.current !== requestId) {
        return;
      }
      const page = data.conversations ?? [];
      setConversations((current) =>
        append ? mergeUniqueById(current, page) : page,
      );
      setConversationsOffset(offset + page.length);
      setHasMoreConversations(Boolean(data.hasMore));
      if (!append) {
        setSelectedChatId((current) => current ?? page[0]?.id);
      }
      setLastSyncAt(new Date());
    } finally {
      if (conversationsRequestRef.current !== requestId) {
        return;
      }
      if (append) {
        setIsLoadingMoreConversations(false);
      } else {
        setIsLoadingMoreConversations(false);
        setIsLoadingConversations(false);
      }
    }
  }

  async function loadMessages(chatId: string, options?: { append?: boolean }) {
    const append = options?.append ?? false;
    if (
      append &&
      (isLoadingMoreMessages || isLoadingMessages || !hasMoreMessages)
    ) {
      return;
    }

    if (append) {
      setIsLoadingMoreMessages(true);
    } else {
      setIsLoadingMessages(true);
      setIsLoadingMoreMessages(false);
      setMessagesOffset(0);
      setHasMoreMessages(true);
    }

    const requestId = messagesRequestRef.current + 1;
    messagesRequestRef.current = requestId;
    const offset = append ? messagesOffset : 0;
    try {
      const response = await fetch(
        `/api/chat/messages?chatId=${encodeURIComponent(chatId)}&limit=${MESSAGES_PAGE_SIZE}&offset=${offset}`,
        {
          cache: "no-store",
        },
      );
      const data = (await response.json()) as MessagesResponse;
      if (
        activeMessagesChatRef.current !== chatId ||
        messagesRequestRef.current !== requestId
      ) {
        return;
      }

      const page = data.messages ?? [];
      setMessages((current) => {
        if (!append) {
          return page;
        }

        return mergeMessagesChronologically(page, current);
      });
      setMessagesOffset(offset + page.length);
      setHasMoreMessages(Boolean(data.hasMore));
    } finally {
      if (messagesRequestRef.current !== requestId) {
        return;
      }
      if (append) {
        setIsLoadingMoreMessages(false);
      } else {
        setIsLoadingMoreMessages(false);
        setIsLoadingMessages(false);
      }
    }
  }

  async function refreshConversations() {
    if (isRefreshingConversationsRef.current) {
      return;
    }

    isRefreshingConversationsRef.current = true;
    try {
      const response = await fetch(
        `/api/chat/conversations?limit=${CONVERSATIONS_PAGE_SIZE}&offset=0`,
        {
          cache: "no-store",
        },
      );
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as ConversationsResponse;
      const page = data.conversations ?? [];

      setConversations((current) =>
        sortConversationsByPriority(mergeUniqueById(current, page)),
      );
      setSelectedChatId((current) => current ?? page[0]?.id);
      setLastSyncAt(new Date());
    } finally {
      isRefreshingConversationsRef.current = false;
    }
  }

  async function refreshMessages(chatId: string) {
    if (isRefreshingMessagesRef.current) {
      return;
    }

    isRefreshingMessagesRef.current = true;
    try {
      const response = await fetch(
        `/api/chat/messages?chatId=${encodeURIComponent(chatId)}&limit=${MESSAGES_PAGE_SIZE}&offset=0`,
        {
          cache: "no-store",
        },
      );
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as MessagesResponse;
      if (activeMessagesChatRef.current !== chatId) {
        return;
      }

      const page = data.messages ?? [];
      setMessages((current) => mergeMessagesChronologically(current, page));
      setLastSyncAt(new Date());
    } finally {
      isRefreshingMessagesRef.current = false;
    }
  }

  async function loadContactProfile(chatId: string, contactName?: string) {
    setIsLoadingProfile(true);
    try {
      const searchParams = new URLSearchParams({ chatId });
      if (contactName) {
        searchParams.set("contactName", contactName);
      }
      const response = await fetch(
        `/api/chat/contact-profile?${searchParams.toString()}`,
        {
          cache: "no-store",
        },
      );
      const data = (await response.json()) as ContactProfileResponse;
      setContactProfile(data.profile);
      setNotesDraft(data.profile.notes);
      setFunnelStageDraft(data.profile.funnelStage);
    } finally {
      setIsLoadingProfile(false);
    }
  }

  async function saveContactProfile() {
    if (!selectedChatId || !activeConversation || isSavingProfile) {
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/chat/contact-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChatId,
          contactName: activeConversation.name,
          funnelStage: funnelStageDraft,
          notes: notesDraft,
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as ContactProfileResponse;
      setContactProfile(data.profile);
      setNotesDraft(data.profile.notes);
      setFunnelStageDraft(data.profile.funnelStage);
    } finally {
      setIsSavingProfile(false);
    }
  }

  function setConversationActionPending(
    chatId: string,
    action: ConversationAction,
    isPending: boolean,
  ) {
    setPendingConversationActions((current) => {
      const currentForChat = current[chatId] ?? {};
      const nextForChat = {
        ...currentForChat,
        [action]: isPending,
      };
      return {
        ...current,
        [chatId]: nextForChat,
      };
    });
  }

  async function runConversationAction(chatId: string, action: ConversationAction) {
    const targetConversation = conversations.find(
      (conversation) => conversation.id === chatId,
    );

    setConversationActionPending(chatId, action, true);

    if (action === "mark-unread") {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === chatId
            ? {
                ...conversation,
                unreadCount: Math.max(1, conversation.unreadCount),
              }
            : conversation,
        ),
      );
    }

    if (action === "archive") {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === chatId
            ? {
                ...conversation,
                isArchived: true,
              }
            : conversation,
        ),
      );
    }

    if (action === "advance-funnel") {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === chatId
            ? {
                ...conversation,
                funnelStage: getNextFunnelStage(
                  conversation.funnelStage ?? "primeiro-contato",
                ),
              }
            : conversation,
        ),
      );
    }

    try {
      const response = await fetch("/api/chat/conversations/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          action,
          contactName: targetConversation?.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to run action ${action}`);
      }

      const data = (await response.json()) as ConversationActionResponse;

      if (action === "advance-funnel" && data.profile) {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === chatId
              ? {
                  ...conversation,
                  funnelStage: data.profile?.funnelStage,
                }
              : conversation,
          ),
        );

        if (selectedChatId === chatId) {
          setContactProfile(data.profile);
          setFunnelStageDraft(data.profile.funnelStage);
          setNotesDraft(data.profile.notes);
        }
      }
    } catch {
      void refreshConversations();
      if (selectedChatId === chatId) {
        void loadContactProfile(chatId, targetConversation?.name);
      }
    } finally {
      setConversationActionPending(chatId, action, false);
    }
  }

  async function handleSend(text: string) {
    if (!selectedChatId) {
      return;
    }

    const chatId = selectedChatId;
    const optimisticId = `${OPTIMISTIC_MESSAGE_ID_PREFIX}${crypto.randomUUID()}`;
    const optimisticMessage: WahaMessage = {
      id: optimisticId,
      chatId,
      fromMe: true,
      text,
      timestamp: Date.now(),
    };

    setMessages((current) =>
      mergeMessagesChronologically(current, [optimisticMessage]),
    );

    const response = await fetch("/api/chat/send-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        text,
      }),
    });

    if (!response.ok) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticId),
      );
      return;
    }

    const rawBody = await response.text();
    if (!rawBody) {
      return;
    }

    try {
      const payload = JSON.parse(rawBody) as unknown;
      const rootPayload = asRecord(payload);
      const confirmed =
        normalizeMessageFromUnknown(payload, {
          chatId,
          fromMe: true,
          text,
        }) ??
        normalizeMessageFromUnknown(rootPayload?.message, {
          chatId,
          fromMe: true,
          text,
        });

      if (!confirmed) {
        return;
      }

      setMessages((current) =>
        mergeMessagesChronologically(current, [confirmed]),
      );
    } catch {
      // Ignore parse errors and keep optimistic rendering.
    }
  }

  React.useEffect(() => {
    void loadSession();
    void loadConversations();
  }, []);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      if (!isPageVisibleRef.current) {
        return;
      }
      void refreshConversations();
      if (selectedChatId) {
        void refreshMessages(selectedChatId);
      }
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedChatId]);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isPageVisibleRef.current) {
        return;
      }
      const hasRecentRealtimeEvent =
        Date.now() - lastRealtimeEventAtRef.current < REALTIME_RECENT_WINDOW_MS;
      if (isRealtimeConnectedRef.current && hasRecentRealtimeEvent) {
        return;
      }
      void refreshConversations();
    }, CONVERSATIONS_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  React.useEffect(() => {
    if (!selectedChatId) {
      activeMessagesChatRef.current = null;
      setMessages([]);
      setMessagesOffset(0);
      setHasMoreMessages(false);
      setIsLoadingMoreMessages(false);
      setContactProfile(null);
      setNotesDraft("");
      setFunnelStageDraft("primeiro-contato");
      return;
    }
    activeMessagesChatRef.current = selectedChatId;
    setMessages([]);
    setMessagesOffset(0);
    setHasMoreMessages(true);
    setIsLoadingMoreMessages(false);
    void loadMessages(selectedChatId);
    void loadContactProfile(selectedChatId, activeConversation?.name);
  }, [activeConversation?.name, selectedChatId]);

  React.useEffect(() => {
    if (!selectedChatId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!isPageVisibleRef.current) {
        return;
      }
      const hasRecentRealtimeEvent =
        Date.now() - lastRealtimeEventAtRef.current < REALTIME_RECENT_WINDOW_MS;
      if (isRealtimeConnectedRef.current && hasRecentRealtimeEvent) {
        return;
      }
      void refreshMessages(selectedChatId);
    }, isRealtimeConnectedRef.current
      ? MESSAGES_REFRESH_INTERVAL_MS
      : BACKGROUND_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedChatId]);

  React.useEffect(() => {
    const source = new EventSource("/api/realtime/waha-events");

    source.addEventListener("open", () => {
      isRealtimeConnectedRef.current = true;
      void refreshConversations();
      if (selectedChatId) {
        void refreshMessages(selectedChatId);
      }
    });

    source.addEventListener("error", () => {
      isRealtimeConnectedRef.current = false;
    });

    source.addEventListener("waha-event", (rawEvent) => {
      const event = rawEvent as MessageEvent<string>;
      const parsed = JSON.parse(event.data) as {
        event?: string;
        chatId?: string;
        payload?: Record<string, unknown>;
      };
      if (!isPageVisibleRef.current) {
        return;
      }

      lastRealtimeEventAtRef.current = Date.now();
      if (
        Date.now() - lastRealtimeConversationRefreshAtRef.current >=
        REALTIME_CONVERSATIONS_REFRESH_THROTTLE_MS
      ) {
        lastRealtimeConversationRefreshAtRef.current = Date.now();
        void refreshConversations();
      }

      if (
        !parsed.chatId ||
        !selectedChatId ||
        parsed.chatId !== selectedChatId
      ) {
        return;
      }

      const payload = parsed.payload ?? {};
      const nestedPayload = asRecord(payload.payload);
      const normalized =
        normalizeMessageFromUnknown(nestedPayload, {
          chatId: selectedChatId,
          fromMe: false,
          text: "",
        }) ??
        normalizeMessageFromUnknown(payload, {
          chatId: selectedChatId,
          fromMe: false,
          text: "",
        });

      if (!normalized) {
        return;
      }

      setMessages((current) =>
        mergeMessagesChronologically(current, [normalized]),
      );
    });

    return () => {
      isRealtimeConnectedRef.current = false;
      source.close();
    };
  }, [selectedChatId]);

  const sessionTone = React.useMemo(() => {
    switch (session?.status) {
      case "WORKING":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
      case "STARTING":
      case "SCAN_QR":
      case "SCAN_QR_CODE":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
      case "FAILED":
      case "STOPPED":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  }, [session?.status]);

  const sessionLabel = React.useMemo(() => {
    switch (session?.status) {
      case "WORKING":
        return "Conectado";
      case "STARTING":
        return "Iniciando";
      case "SCAN_QR":
      case "SCAN_QR_CODE":
        return "Escanear QR";
      case "FAILED":
        return "Falha";
      case "STOPPED":
        return "Parado";
      default:
        return "Desconhecido";
    }
  }, [session?.status]);

  const currentFunnelStage = contactProfile?.funnelStage ?? "primeiro-contato";
  const rawDetailsPreview = React.useMemo(
    () => JSON.stringify(contactProfile?.rawDetails ?? {}, null, 2),
    [contactProfile?.rawDetails]
  );
  const isContactProfileDirty =
    funnelStageDraft !== (contactProfile?.funnelStage ?? "primeiro-contato") ||
    notesDraft !== (contactProfile?.notes ?? "");
  const renderContactProfilePanel = (idPrefix: string, includeFooter = true) => (
    <div className="space-y-4 px-4 pb-4">
      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            {getContactInitials(activeConversation?.name)}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-semibold">
              {activeConversation?.name ?? "Nenhum contato selecionado"}
            </p>
            <p className="text-muted-foreground text-xs">
              {contactProfile?.phoneNumber ?? "--"}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                {contactProfile?.isBusiness ? "Perfil comercial" : "Pessoa física"}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {contactProfile?.isMyContact ? "Na agenda" : "Não salvo na agenda"}
              </Badge>
            </div>
          </div>
        </div>
        {contactProfile?.avatarUrl ? (
          <a
            href={contactProfile.avatarUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-xs text-sky-600 hover:underline"
          >
            Ver avatar no WhatsApp
          </a>
        ) : null}
      </div>

      <div className="rounded-xl border p-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Dados do contato
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
          <div>
            <p className="text-muted-foreground text-[11px]">Push name</p>
            <p className="truncate text-xs">{contactProfile?.pushName ?? "--"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[11px]">Short name</p>
            <p className="truncate text-xs">{contactProfile?.shortName ?? "--"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-[11px]">Nome comercial</p>
            <p className="truncate text-xs">{contactProfile?.businessName ?? "--"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-[11px]">Sobre</p>
            <p className="line-clamp-2 text-xs">{contactProfile?.about ?? "--"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border p-3">
        <Label htmlFor={`${idPrefix}-funnel-stage`}>Status do funil</Label>
        <Select
          value={funnelStageDraft}
          onValueChange={(value) => setFunnelStageDraft(value as FunnelStage)}
          disabled={!activeConversation || isLoadingProfile}
        >
          <SelectTrigger id={`${idPrefix}-funnel-stage`} className="w-full">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            {funnelStages.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {funnelStageLabels[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 rounded-xl border p-3">
        <Label htmlFor={`${idPrefix}-contact-notes`}>Anotações</Label>
        <Textarea
          id={`${idPrefix}-contact-notes`}
          placeholder="Ex.: paciente já enviou exames, prefere atendimento às quartas..."
          rows={7}
          value={notesDraft}
          disabled={!activeConversation || isLoadingProfile}
          onChange={(event) => setNotesDraft(event.target.value)}
        />
      </div>

      <details className="rounded-xl border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Dados brutos do contato (WAHA)
        </summary>
        <div className="mt-2 space-y-2">
          <Label htmlFor={`${idPrefix}-contact-raw`} className="text-xs text-muted-foreground">
            Visualização técnica
          </Label>
          <Textarea
            id={`${idPrefix}-contact-raw`}
            rows={8}
            value={rawDetailsPreview}
            readOnly
            className="font-mono text-[11px]"
          />
        </div>
      </details>

      {includeFooter ? (
        <div className="space-y-2">
          <Button
            type="button"
            className="w-full"
            onClick={() => void saveContactProfile()}
            disabled={
              !activeConversation ||
              isLoadingProfile ||
              isSavingProfile ||
              !isContactProfileDirty
            }
          >
            {isSavingProfile ? "Salvando..." : "Salvar perfil"}
          </Button>
          <p className="text-muted-foreground text-xs">
            {contactProfile?.updatedAt
              ? `Última atualização: ${new Date(contactProfile.updatedAt).toLocaleString()}`
              : "Sem dados salvos no SQLite"}
          </p>
        </div>
      ) : null}
    </div>
  );

  const funnelTone = React.useMemo(() => {
    switch (currentFunnelStage) {
      case "convertido":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
      case "nao-convertido":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
      case "consulta-agendada":
      case "procedimento-cirurgia-agendado":
        return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
      case "qualificacao-clinica":
      case "consulta-realizada":
      case "proposta-procedimento-cirurgia":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  }, [currentFunnelStage]);

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "22rem",
          "--header-height": "4.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        conversations={conversations}
        selectedChatId={selectedChatId}
        onSelectConversation={setSelectedChatId}
        onMarkAsUnread={(chatId) => runConversationAction(chatId, "mark-unread")}
        onArchiveConversation={(chatId) =>
          runConversationAction(chatId, "archive")
        }
        onAdvanceFunnelStage={(chatId) =>
          runConversationAction(chatId, "advance-funnel")
        }
        isConversationActionPending={(chatId, action) =>
          Boolean(pendingConversationActions[chatId]?.[action])
        }
        isLoading={isLoadingConversations}
        isLoadingMore={isLoadingMoreConversations}
        hasMore={hasMoreConversations}
        onLoadMore={() => void loadConversations({ append: true })}
        sessionLabel={sessionLabel}
        sessionToneClassName={sessionTone}
      />
      <SidebarInset className="h-dvh overflow-hidden bg-white md:my-1 md:h-[calc(100dvh-0.5rem)]">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white px-0 py-0 md:px-5 md:py-1 lg:px-7">
          <div className="flex min-h-0 flex-1 gap-4 md:gap-5  lg:gap-7">
            <section className="chat-layout grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden md:rounded-2xl md:border md:border-border/70 md:bg-white md:shadow-sm">
              <div className="border-border/70 flex shrink-0 items-center justify-between gap-2 border-b px-2 py-3 md:gap-3 md:px-3">
                <div className="flex min-w-0 items-center gap-2">
                  <SidebarTrigger className="md:hidden" />
                  <Separator orientation="vertical" className="h-6 md:hidden" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-tight md:text-base">
                      {activeConversation?.name ??
                        "Nenhuma conversa selecionada"}
                    </p>
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 md:gap-2">
                      <Badge
                        className={cn(
                          "rounded-full border-0 px-2 py-0.5 text-[11px] whitespace-nowrap",
                          funnelTone,
                        )}
                      >
                        Funil: {funnelStageLabels[currentFunnelStage]}
                      </Badge>
                      <p className="text-muted-foreground min-w-0 truncate text-[11px]">
                        {activeConversation
                          ? `${messages.length} ${messages.length === 1 ? "mensagem" : "mensagens"} • ${
                              lastSyncAt
                                ? `Atualizado ${lastSyncAt.toLocaleTimeString()}`
                                : "Sem sincronização"
                            }`
                          : "Escolha uma conversa na barra lateral"}
                      </p>
                    </div>
                  </div>
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 px-2.5 text-[11px] md:h-9 md:px-3 md:text-sm xl:hidden"
                      disabled={!activeConversation}
                    >
                      Perfil
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-full overflow-hidden p-0 sm:max-w-md xl:hidden"
                  >
                    <div className="flex h-full min-h-0 flex-col">
                      <SheetHeader className="shrink-0 border-b px-4 py-3">
                        <SheetTitle>Perfil do contato</SheetTitle>
                        <SheetDescription>
                          Atualize o funil de vendas e registre anotações de
                          consulta oftalmologia.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="min-h-0 flex-1 overflow-y-auto py-4">
                        {renderContactProfilePanel("mobile", false)}
                      </div>

                      <div className="shrink-0 overflow-y-auto border-t px-4 py-3">
                        <Button
                          type="button"
                          className="w-full"
                          onClick={() => void saveContactProfile()}
                          disabled={
                            !activeConversation ||
                            isLoadingProfile ||
                            isSavingProfile ||
                            !isContactProfileDirty
                          }
                        >
                          {isSavingProfile ? "Salvando..." : "Salvar perfil"}
                        </Button>
                        <p className="text-muted-foreground mt-2 text-xs">
                          {contactProfile?.updatedAt
                            ? `Última atualização: ${new Date(contactProfile.updatedAt).toLocaleString()}`
                            : "Sem dados salvos no SQLite"}
                        </p>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="min-h-0 overflow-hidden">
                <ChatThread
                  activeConversation={activeConversation}
                  messages={messages}
                  isLoading={isLoadingMessages}
                  isLoadingOlder={isLoadingMoreMessages}
                  hasMoreOlder={hasMoreMessages}
                  onLoadOlder={() =>
                    selectedChatId
                      ? void loadMessages(selectedChatId, { append: true })
                      : undefined
                  }
                />
              </div>
              <div className="shrink-0">
                <ChatComposer disabled={!selectedChatId} onSend={handleSend} />
              </div>
            </section>

            <aside className="border-border/70 hidden w-88 shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm xl:flex xl:flex-col">
              <div className="border-border/70 shrink-0 overflow-y-auto border-b px-4 py-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Perfil do contato
                </h2>
                <p className="text-sm text-muted-foreground">
                  Atualize o funil de vendas e registre anotações de consulta
                  oftalmologia.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pt-4">
                {renderContactProfilePanel("desktop", false)}
              </div>
              <div className="shrink-0 overflow-y-auto border-t px-4 py-3">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void saveContactProfile()}
                  disabled={
                    !activeConversation ||
                    isLoadingProfile ||
                    isSavingProfile ||
                    !isContactProfileDirty
                  }
                >
                  {isSavingProfile ? "Salvando..." : "Salvar perfil"}
                </Button>
                <p className="text-muted-foreground mt-2 text-xs">
                  {contactProfile?.updatedAt
                    ? `Última atualização: ${new Date(contactProfile.updatedAt).toLocaleString()}`
                    : "Sem dados salvos no SQLite"}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
