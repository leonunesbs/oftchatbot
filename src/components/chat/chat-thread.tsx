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
  const shouldStickToBottomRef = React.useRef(true);
  const isLoadingOlderRef = React.useRef(isLoadingOlder);
  const pendingPrependRef = React.useRef(false);
  const previousScrollHeightRef = React.useRef(0);

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
  }, [messages]);

  React.useEffect(() => {
    shouldStickToBottomRef.current = true;
    pendingPrependRef.current = false;
    previousScrollHeightRef.current = 0;
  }, [activeConversation?.id]);

  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const bottomDistance = target.scrollHeight - target.clientHeight - target.scrollTop;
      shouldStickToBottomRef.current = bottomDistance <= 80;

      if (!hasMoreOlder || !onLoadOlder || isLoadingOlderRef.current) {
        return;
      }

      if (target.scrollTop <= 80) {
        pendingPrependRef.current = true;
        previousScrollHeightRef.current = target.scrollHeight;
        onLoadOlder();
      }
    },
    [hasMoreOlder, onLoadOlder]
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
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
