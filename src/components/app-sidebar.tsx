"use client";

import { Archive, Eye, Mail, MessageCircle, Pin, Search, TrendingUp } from "lucide-react";
import type { ComponentProps } from "react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { funnelStageLabels } from "@/lib/contact-profile/types";
import { cn } from "@/lib/utils";
import type { WahaConversation } from "@/lib/waha/types";

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  conversations: WahaConversation[];
  selectedChatId?: string;
  onSelectConversation: (chatId: string) => void;
  onMarkAsUnread?: (chatId: string) => void | Promise<void>;
  onArchiveConversation?: (chatId: string) => void | Promise<void>;
  onAdvanceFunnelStage?: (chatId: string) => void | Promise<void>;
  isConversationActionPending?: (
    chatId: string,
    action: "mark-unread" | "archive" | "advance-funnel",
  ) => boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  sessionLabel: string;
  sessionToneClassName: string;
  sessionQrScannerHref?: string | null;
};

function formatConversationTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getConversationInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "C";
  }

  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "C";
}

function getFunnelToneClass(stage?: WahaConversation["funnelStage"]) {
  switch (stage) {
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
}

function ConversationCardSkeleton() {
  return (
    <div className="bg-sidebar-accent/35 border-sidebar-border h-[122px] rounded-xl border px-2.5 py-2">
      <div className="flex items-start gap-2.5">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-30 max-w-[60%]" />
            <Skeleton className="ml-auto h-3 w-10" />
          </div>
          <Skeleton className="h-4 w-24 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-36 max-w-[75%]" />
            <Skeleton className="ml-auto h-4 w-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({
  conversations,
  selectedChatId,
  onSelectConversation,
  onMarkAsUnread,
  onArchiveConversation,
  onAdvanceFunnelStage,
  isConversationActionPending,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  sessionLabel,
  sessionToneClassName,
  sessionQrScannerHref,
  ...props
}: AppSidebarProps) {
  const [query, setQuery] = React.useState("");
  const listContainerRef = React.useRef<HTMLDivElement | null>(null);

  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }

      const aDate = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bDate = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [conversations]);

  const filteredConversations = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sortedConversations;
    }

    return sortedConversations.filter((conversation) => {
      const text =
        `${conversation.name} ${conversation.preview ?? ""}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [query, sortedConversations]);

  const unreadTotal = React.useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + Math.max(0, conversation.unreadCount),
        0,
      ),
    [conversations],
  );

  const handleListScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || isLoadingMore || !onLoadMore) {
        return;
      }

      const target = event.currentTarget;
      const threshold = 120;
      const isNearBottom =
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - threshold;
      if (isNearBottom) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore],
  );

  React.useEffect(() => {
    const container = listContainerRef.current;
    if (!container || !hasMore || isLoadingMore || !onLoadMore) {
      return;
    }
    if (container.scrollHeight <= container.clientHeight + 1) {
      onLoadMore();
    }
  }, [filteredConversations.length, hasMore, isLoadingMore, onLoadMore]);

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Eye className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none">
              OFT ChatBot
            </p>
            <p className="text-muted-foreground truncate pt-1 text-xs">
              WhatsApp CRM
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar conversa"
            className="h-9 bg-background pl-9"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex min-h-0 flex-1 pt-0">
          <div
            ref={listContainerRef}
            className="h-full space-y-1 overflow-y-auto pr-1"
            onScroll={handleListScroll}
          >
            {isLoading ? (
              <div className="space-y-2 px-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <ConversationCardSkeleton key={index} />
                ))}
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => {
                const isActive = selectedChatId === conversation.id;
                const timeLabel = formatConversationTime(
                  conversation.lastMessageAt,
                );
                const unreadCount = Math.max(0, conversation.unreadCount);
                const funnelStage =
                  conversation.funnelStage ?? "primeiro-contato";

                const markUnreadPending = isConversationActionPending?.(
                  conversation.id,
                  "mark-unread",
                );
                const archivePending = isConversationActionPending?.(
                  conversation.id,
                  "archive",
                );
                const advanceFunnelPending = isConversationActionPending?.(
                  conversation.id,
                  "advance-funnel",
                );

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "h-[122px] w-full rounded-xl border px-2.5 py-2 transition-colors",
                      isActive
                        ? "bg-sidebar-accent border-sidebar-border"
                        : "border-transparent hover:bg-sidebar-accent/70",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conversation.id)}
                      className="focus-visible:ring-sidebar-ring w-full rounded-md text-left outline-hidden focus-visible:ring-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="bg-sidebar-primary/15 text-sidebar-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                          {getConversationInitials(conversation.name)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                              {conversation.name || "Contato sem nome"}
                            </p>
                            {conversation.isPinned ? (
                              <Pin className="text-muted-foreground size-3.5 shrink-0" />
                            ) : null}
                            {conversation.isArchived ? (
                              <Archive className="text-muted-foreground size-3.5 shrink-0" />
                            ) : null}
                            {timeLabel ? (
                              <span className="text-muted-foreground ml-auto shrink-0 text-[11px]">
                                {timeLabel}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "rounded-full border-0 px-2 py-0.5 text-[10px] whitespace-nowrap",
                                getFunnelToneClass(funnelStage),
                              )}
                            >
                              {funnelStageLabels[funnelStage]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-muted-foreground line-clamp-1 text-xs">
                              {conversation.preview || "Sem mensagens recentes"}
                            </p>
                            {unreadCount > 0 ? (
                              <span className="bg-sidebar-primary text-sidebar-primary-foreground ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        disabled={Boolean(markUnreadPending)}
                        onClick={() => void onMarkAsUnread?.(conversation.id)}
                        aria-label="Marcar como não lida"
                        title="Marcar como não lida"
                        className="text-muted-foreground hover:bg-background inline-flex size-6 items-center justify-center rounded-md transition-colors disabled:opacity-60"
                      >
                        <Mail className="size-3" />
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(archivePending)}
                        onClick={() => void onArchiveConversation?.(conversation.id)}
                        aria-label="Arquivar conversa"
                        title="Arquivar conversa"
                        className="text-muted-foreground hover:bg-background inline-flex size-6 items-center justify-center rounded-md transition-colors disabled:opacity-60"
                      >
                        <Archive className="size-3" />
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(advanceFunnelPending)}
                        onClick={() => void onAdvanceFunnelStage?.(conversation.id)}
                        aria-label="Avançar funil"
                        title="Avançar funil"
                        className="text-muted-foreground hover:bg-background ml-auto inline-flex size-6 items-center justify-center rounded-md transition-colors disabled:opacity-60"
                      >
                        <TrendingUp className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-xs">
                Nenhuma conversa encontrada.
              </div>
            )}
            {!isLoading && isLoadingMore ? (
              <div className="space-y-2 px-1 pt-1">
                {Array.from({ length: 3 }).map((_, index) => (
                  <ConversationCardSkeleton key={`load-more-${index}`} />
                ))}
              </div>
            ) : null}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="bg-background/60 rounded-lg border px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <MessageCircle className="size-3.5" />
              Conversas
            </div>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {conversations.length}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between">
            {sessionQrScannerHref ? (
              <a
                href={sessionQrScannerHref}
                target="_blank"
                rel="noreferrer"
                title="Abrir ferramenta de escanear QR code"
                className="focus-visible:ring-sidebar-ring rounded-full outline-hidden focus-visible:ring-2"
              >
                <Badge
                  className={cn(
                    "rounded-full border-0 px-2 py-0.5 text-[11px] hover:opacity-90",
                    sessionToneClassName,
                  )}
                >
                  {sessionLabel}
                </Badge>
              </a>
            ) : (
              <Badge
                className={cn(
                  "rounded-full border-0 px-2 py-0.5 text-[11px]",
                  sessionToneClassName,
                )}
              >
                {sessionLabel}
              </Badge>
            )}
            <span className="text-muted-foreground text-[11px]">
              {unreadTotal > 0 ? `${unreadTotal} não lidas` : "Inbox zerada"}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
