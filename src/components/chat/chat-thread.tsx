"use client";

import * as React from "react";

import { MessageBubble } from "@/components/chat/message-bubble";
import type { WahaConversation, WahaMessage } from "@/lib/waha/types";

type ChatThreadProps = {
  activeConversation?: WahaConversation;
  messages: WahaMessage[];
  isLoading?: boolean;
  isLoadingOlder?: boolean;
  hasMoreOlder?: boolean;
  onLoadOlder?: () => void;
};

export function ChatThread({
  activeConversation,
  messages,
  isLoading,
  isLoadingOlder = false,
  hasMoreOlder = false,
  onLoadOlder,
}: ChatThreadProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const messageRowRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const shouldStickToBottomRef = React.useRef(true);
  const isLoadingOlderRef = React.useRef(isLoadingOlder);
  const pendingPrependRef = React.useRef(false);
  const previousScrollHeightRef = React.useRef(0);
  const [topVisibleDate, setTopVisibleDate] = React.useState<string | null>(null);
  const [showTopDateBadge, setShowTopDateBadge] = React.useState(false);

  const getDayKey = React.useCallback((dateLike: Date | string | number) => {
    const date = new Date(dateLike);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }, []);

  const getRelativeDayLabel = React.useCallback(
    (message: WahaMessage) => {
      const messageDate = new Date(message.timestamp);
      const now = new Date();
      const today = new Date(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const messageDayKey = getDayKey(messageDate);
      if (messageDayKey === getDayKey(today)) {
        return "HOJE";
      }

      if (messageDayKey === getDayKey(yesterday)) {
        return "ONTEM";
      }

      const messageDayStart = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      );
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffInDays = Math.floor((todayStart.getTime() - messageDayStart.getTime()) / 86_400_000);

      if (diffInDays >= 2 && diffInDays <= 6) {
        return messageDate.toLocaleDateString("pt-BR", { weekday: "long" }).toLocaleUpperCase("pt-BR");
      }

      return messageDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
    [getDayKey]
  );

  const getMessageDateLabel = React.useCallback((message: WahaMessage) => {
    return getRelativeDayLabel(message);
  }, [getRelativeDayLabel]);

  const syncTopVisibleDate = React.useCallback(() => {
    const node = scrollContainerRef.current;
    if (!node || !messages.length) {
      setTopVisibleDate(null);
      return;
    }

    const viewTop = node.scrollTop;
    let nextIndex = messages.length - 1;

    for (let idx = 0; idx < messages.length; idx += 1) {
      const row = messageRowRefs.current[idx];
      if (!row) {
        continue;
      }

      if (row.offsetTop + row.offsetHeight >= viewTop + 8) {
        nextIndex = idx;
        break;
      }
    }

    setTopVisibleDate(getMessageDateLabel(messages[nextIndex]));
  }, [getMessageDateLabel, messages]);

  React.useEffect(() => {
    isLoadingOlderRef.current = isLoadingOlder;
  }, [isLoadingOlder]);

  React.useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) {
      return;
    }

    if (pendingPrependRef.current) {
      const nextHeight = node.scrollHeight;
      const delta = nextHeight - previousScrollHeightRef.current;
      node.scrollTop += delta;
      pendingPrependRef.current = false;
      return;
    }

    if (shouldStickToBottomRef.current) {
      node.scrollTop = node.scrollHeight;
    }

    syncTopVisibleDate();
  }, [messages, syncTopVisibleDate]);

  React.useEffect(() => {
    shouldStickToBottomRef.current = true;
    pendingPrependRef.current = false;
    previousScrollHeightRef.current = 0;
    setTopVisibleDate(null);
    setShowTopDateBadge(false);
    messageRowRefs.current = [];
  }, [activeConversation?.id]);

  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const bottomDistance = target.scrollHeight - target.clientHeight - target.scrollTop;
      shouldStickToBottomRef.current = bottomDistance <= 80;
      setShowTopDateBadge(!shouldStickToBottomRef.current);
      syncTopVisibleDate();

      if (!hasMoreOlder || !onLoadOlder || isLoadingOlderRef.current) {
        return;
      }

      if (target.scrollTop <= 80) {
        pendingPrependRef.current = true;
        previousScrollHeightRef.current = target.scrollHeight;
        onLoadOlder();
      }
    },
    [hasMoreOlder, onLoadOlder, syncTopVisibleDate]
  );

  if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="bg-muted/60 border-border/70 rounded-2xl border px-6 py-8 text-center">
          <p className="text-sm font-medium">Selecione uma conversa para começar</p>
          <p className="text-muted-foreground mt-1 text-xs">Escolha um contato na barra lateral para ver a conversa.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 px-3 py-4 md:px-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={`message-skeleton-${idx}`}
            className="bg-muted h-11 animate-pulse rounded-2xl"
            style={{ width: `${Math.max(36, 82 - idx * 6)}%` }}
          />
        ))}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="bg-muted/60 border-border/70 rounded-2xl border px-6 py-8 text-center">
          <p className="text-sm font-medium">Nenhuma mensagem nessa conversa</p>
          <p className="text-muted-foreground mt-1 text-xs">Envie a primeira mensagem para iniciar o histórico.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {showTopDateBadge && topVisibleDate ? (
        <div className="pointer-events-none absolute top-2 left-1/2 z-10 -translate-x-1/2">
          <span className="bg-background/95 text-muted-foreground border-border/80 inline-flex rounded-full border px-3 py-1 text-xs font-medium shadow-xs backdrop-blur">
            {topVisibleDate}
          </span>
        </div>
      ) : null}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="chat-thread-scroll flex h-full flex-col gap-3 overflow-y-auto px-2 py-3 md:px-3 md:py-4"
      >
        {isLoadingOlder ? (
          <div className="space-y-2 pb-1">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={`older-message-skeleton-${idx}`}
                className="bg-muted h-10 animate-pulse rounded-2xl"
                style={{ width: `${Math.max(44, 66 - idx * 8)}%` }}
              />
            ))}
          </div>
        ) : null}
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const startsNewDay =
            !previousMessage || getDayKey(previousMessage.timestamp) !== getDayKey(message.timestamp);
          const dayLabel = getRelativeDayLabel(message);

          return (
            <div
              key={message.id}
              ref={(node) => {
                messageRowRefs.current[index] = node;
              }}
            >
              {startsNewDay ? (
                <div className="my-2 flex items-center gap-3">
                  <div className="bg-border/70 h-px flex-1" />
                  <span className="text-muted-foreground text-[11px] font-semibold tracking-wide">{dayLabel}</span>
                  <div className="bg-border/70 h-px flex-1" />
                </div>
              ) : null}
              <MessageBubble message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
