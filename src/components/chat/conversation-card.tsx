"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { WahaConversation } from "@/lib/waha/types";

type ConversationCardProps = {
  conversation: WahaConversation;
  isSelected?: boolean;
  onSelect?: (chatId: string) => void;
};

export function ConversationCard({ conversation, isSelected, onSelect }: ConversationCardProps) {
  const [hasImageError, setHasImageError] = React.useState(false);
  const unread = conversation.unreadCount > 0;
  const initials = conversation.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hour = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  React.useEffect(() => {
    setHasImageError(false);
  }, [conversation.avatarUrl]);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(conversation.id)}
      className={cn(
        "hover:bg-sidebar-accent/60 focus-visible:ring-sidebar-ring/50 flex w-full items-start gap-3 rounded-lg bg-transparent px-2.5 py-2.5 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
        isSelected && "bg-sidebar-accent",
        "active:bg-sidebar-accent/80"
      )}
    >
      {conversation.avatarUrl && !hasImageError ? (
        <img
          src={conversation.avatarUrl}
          alt={conversation.name}
          onError={() => setHasImageError(true)}
          className="size-10 shrink-0 rounded-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {initials || "CH"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-medium tracking-tight">{conversation.name}</p>
            {conversation.isPinned ? <span className="text-sidebar-foreground/60 text-[10px]">Fixada</span> : null}
          </div>
          <span className="text-sidebar-foreground/65 shrink-0 text-[11px]">{hour}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sidebar-foreground/70 truncate text-xs">
            {conversation.preview ?? "Sem mensagem recente"}
          </p>
          {unread ? (
            <span className="bg-primary text-primary-foreground inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-medium">
              {conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
