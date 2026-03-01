"use client";

import * as React from "react";

import { ConversationList } from "@/components/chat/conversation-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { WahaConversation } from "@/lib/waha/types";
import { MessageCircleMore } from "lucide-react";

type ConversationFilter = "all" | "unread" | "pinned" | "archived";

const FILTERS: Array<{ id: ConversationFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "unread", label: "Nao lidas" },
  { id: "pinned", label: "Fixados" },
  { id: "archived", label: "Arquivadas" },
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  conversations: WahaConversation[];
  selectedChatId?: string;
  onSelectConversation?: (chatId: string) => void;
  isLoading?: boolean;
  sessionLabel?: string;
  sessionToneClassName?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

function matchesSearch(conversation: WahaConversation, rawQuery: string) {
  if (!rawQuery) {
    return true;
  }
  const query = rawQuery.toLowerCase();
  return (
    conversation.name.toLowerCase().includes(query) ||
    conversation.id.toLowerCase().includes(query) ||
    (conversation.preview ?? "").toLowerCase().includes(query)
  );
}

export function AppSidebar({
  conversations,
  selectedChatId,
  onSelectConversation,
  isLoading,
  sessionLabel,
  sessionToneClassName,
  onRefresh,
  isRefreshing,
  ...props
}: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<ConversationFilter>("all");

  const searchedConversations = React.useMemo(
    () => conversations.filter((conversation) => matchesSearch(conversation, search.trim())),
    [conversations, search]
  );

  const pinnedConversations = React.useMemo(
    () => searchedConversations.filter((conversation) => conversation.isPinned && !conversation.isArchived),
    [searchedConversations]
  );
  const activeConversations = React.useMemo(
    () => searchedConversations.filter((conversation) => !conversation.isArchived),
    [searchedConversations]
  );

  const filteredConversations = React.useMemo(() => {
    if (activeFilter === "unread") {
      return activeConversations.filter((conversation) => conversation.unreadCount > 0);
    }
    if (activeFilter === "pinned") {
      return pinnedConversations;
    }
    if (activeFilter === "archived") {
      return searchedConversations.filter((conversation) => conversation.isArchived);
    }
    return activeConversations;
  }, [activeConversations, activeFilter, pinnedConversations, searchedConversations]);

  const unpinnedConversations = React.useMemo(
    () => activeConversations.filter((conversation) => !conversation.isPinned),
    [activeConversations]
  );

  const emptyByFilter = React.useMemo(() => {
    if (activeFilter === "unread") {
      return {
        title: "Nenhuma conversa nao lida",
        description: "Quando houver novas mensagens, elas aparecerao aqui.",
      };
    }
    if (activeFilter === "pinned") {
      return {
        title: "Nenhuma conversa fixada",
        description: "Fixe contatos importantes para acesso rapido.",
      };
    }
    if (activeFilter === "archived") {
      return {
        title: "Nenhuma conversa arquivada",
        description: "Arquive conversas para manter sua lista principal limpa.",
      };
    }
    return {
      title: "Nenhuma conversa encontrada",
      description: "Tente ajustar sua busca ou atualizar a lista.",
    };
  }, [activeFilter]);

  function handleSelect(chatId: string) {
    onSelectConversation?.(chatId);
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  const unreadCount = React.useMemo(
    () => activeConversations.reduce((total, item) => total + item.unreadCount, 0),
    [activeConversations]
  );

  return (
    <Sidebar variant="floating" collapsible="offcanvas" {...props}>
      <SidebarHeader className="gap-3 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button type="button" className="cursor-default">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <MessageCircleMore className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Conversas</span>
                  <span className="truncate text-xs">{activeConversations.length} contatos ativos</span>
                </div>
                <Badge className={cn("rounded-full border-0 px-2 py-0.5 text-[11px]", sessionToneClassName)}>
                  {sessionLabel ?? "Desconhecido"}
                </Badge>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex items-center gap-2">
          <SidebarInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar ou iniciar conversa"
            className="h-9 text-sm"
          />
          <Button size="sm" variant="outline" className="h-9 px-2.5 text-xs" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? "..." : "Atual."}
          </Button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {FILTERS.map((filter) => {
            const isActive = filter.id === activeFilter;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                    : "border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent/70 text-sidebar-foreground/80"
                )}
              >
                {filter.label}
              </button>
            );
          })}
          <span className="text-sidebar-foreground/60 ml-auto shrink-0 text-[11px]">{unreadCount} nao lidas</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="pb-3">
        {activeFilter === "all" && pinnedConversations.length > 0 ? (
          <ConversationList
            title="Fixadas"
            conversations={pinnedConversations}
            selectedChatId={selectedChatId}
            onSelect={handleSelect}
            isLoading={isLoading}
          />
        ) : null}

        {activeFilter === "all" && unpinnedConversations.length > 0 ? (
          <ConversationList
            title={pinnedConversations.length > 0 ? "Conversas" : undefined}
            conversations={unpinnedConversations}
            selectedChatId={selectedChatId}
            onSelect={handleSelect}
            isLoading={isLoading}
          />
        ) : null}

        {activeFilter !== "all" ? (
          <ConversationList
            conversations={filteredConversations}
            selectedChatId={selectedChatId}
            onSelect={handleSelect}
            isLoading={isLoading}
            emptyTitle={emptyByFilter.title}
            emptyDescription={emptyByFilter.description}
          />
        ) : null}

        {activeFilter === "all" && !isLoading && filteredConversations.length === 0 ? (
          <ConversationList
            conversations={[]}
            selectedChatId={selectedChatId}
            onSelect={handleSelect}
            emptyTitle={emptyByFilter.title}
            emptyDescription={emptyByFilter.description}
          />
        ) : null}
      </SidebarContent>
      <SidebarFooter className="px-3 pb-3">
        <div className="border-sidebar-border bg-sidebar-accent/30 rounded-xl border px-2.5 py-2 text-xs">
          <p className="text-sidebar-foreground/70">{unreadCount} nao lidas</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
