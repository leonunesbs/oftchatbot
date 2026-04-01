"use client";

import { ConversationCard } from "@/components/chat/conversation-card";
import type { WahaConversation } from "@/lib/waha/types";

type ConversationListProps = {
  conversations: WahaConversation[];
  selectedChatId?: string;
  onSelect?: (chatId: string) => void;
  isLoading?: boolean;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ConversationList({
  conversations,
  selectedChatId,
  onSelect,
  isLoading,
  title,
  emptyTitle = "Nenhuma conversa encontrada",
  emptyDescription = "Tente ajustar sua busca ou recarregar as conversas.",
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2.5 px-3 pb-3">
        {title ? <p className="text-sidebar-foreground/70 px-0.5 text-[11px] font-semibold tracking-wide uppercase">{title}</p> : null}
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={`conversation-skeleton-${idx}`}
            className="bg-sidebar-accent/55 border-sidebar-border h-18 animate-pulse rounded-xl border"
          />
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="px-3 py-4">
        {title ? <p className="text-sidebar-foreground/70 mb-2.5 px-0.5 text-[11px] font-semibold tracking-wide uppercase">{title}</p> : null}
        <div className="bg-sidebar-accent/35 border-sidebar-border rounded-xl border px-3 py-4 text-center">
          <p className="text-sm font-medium">{emptyTitle}</p>
          <p className="text-sidebar-foreground/70 mt-1 text-xs">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-3 pb-3">
      {title ? <p className="text-sidebar-foreground/70 px-0.5 text-[11px] font-semibold tracking-wide uppercase">{title}</p> : null}
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedChatId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
