"use client";

import * as React from "react";

import { MessageBubble } from "@/components/chat/message-bubble";
import type { WahaConversation, WahaMessage } from "@/lib/waha/types";

type ChatThreadProps = {
  activeConversation?: WahaConversation;
  messages: WahaMessage[];
  isLoading?: boolean;
};

export function ChatThread({ activeConversation, messages, isLoading }: ChatThreadProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) {
      setIsOverflowing(false);
      return;
    }

    const updateOverflow = () => {
      setIsOverflowing(node.scrollHeight > node.clientHeight + 1);
    };

    updateOverflow();

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(node);
    window.addEventListener("resize", updateOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [messages.length, activeConversation?.id]);

  React.useEffect(() => {
    if (!scrollContainerRef.current || !messages.length) {
      return;
    }

    if (isOverflowing) {
      scrollContainerRef.current.scrollTop = 0;
      return;
    }

    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [messages, isOverflowing]);

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
      className={`chat-thread-scroll flex h-full gap-3 overflow-y-auto px-2 py-3 md:px-3 md:py-4 ${
        isOverflowing ? "flex-col-reverse" : "flex-col"
      }`}
    >
      {(isOverflowing ? [...messages].reverse() : messages).map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
