"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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

const CONVERSATIONS_PAGE_SIZE = 30;
const MESSAGES_PAGE_SIZE = 40;
const CONVERSATIONS_REFRESH_INTERVAL_MS = 10_000;
const MESSAGES_REFRESH_INTERVAL_MS = 3_000;

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
  return mergeUniqueById(current, incoming).sort(
    (a, b) => a.timestamp - b.timestamp,
  );
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
  const activeMessagesChatRef = React.useRef<string | null>(null);
  const conversationsRequestRef = React.useRef(0);
  const messagesRequestRef = React.useRef(0);
  const isRefreshingConversationsRef = React.useRef(false);
  const isRefreshingMessagesRef = React.useRef(false);

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

  async function handleSend(text: string) {
    if (!selectedChatId) {
      return;
    }

    await fetch("/api/chat/send-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: selectedChatId,
        text,
      }),
    });

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        chatId: selectedChatId,
        fromMe: true,
        text,
        timestamp: Date.now(),
      },
    ]);
  }

  React.useEffect(() => {
    void loadSession();
    void loadConversations();
  }, []);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
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
      void refreshMessages(selectedChatId);
    }, MESSAGES_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedChatId]);

  React.useEffect(() => {
    const source = new EventSource("/api/realtime/waha-events");

    source.addEventListener("waha-event", (rawEvent) => {
      const event = rawEvent as MessageEvent<string>;
      const parsed = JSON.parse(event.data) as {
        event?: string;
        chatId?: string;
        payload?: Record<string, unknown>;
      };

      if (
        !parsed.chatId ||
        !selectedChatId ||
        parsed.chatId !== selectedChatId
      ) {
        return;
      }

      const payload = parsed.payload ?? {};
      const nestedPayload =
        payload.payload && typeof payload.payload === "object"
          ? (payload.payload as Record<string, unknown>)
          : undefined;
      const text =
        (typeof nestedPayload?.body === "string"
          ? nestedPayload.body
          : undefined) ??
        (typeof nestedPayload?.text === "string"
          ? nestedPayload.text
          : undefined) ??
        (typeof payload.body === "string" ? payload.body : undefined) ??
        (typeof payload.text === "string" ? payload.text : undefined) ??
        "";
      if (!text) {
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          chatId: selectedChatId,
          fromMe: false,
          text,
          timestamp: Date.now(),
        },
      ]);
    });

    return () => {
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
  const isContactProfileDirty =
    funnelStageDraft !== (contactProfile?.funnelStage ?? "primeiro-contato") ||
    notesDraft !== (contactProfile?.notes ?? "");
  const renderContactProfilePanel = (idPrefix: string) => (
    <div className="space-y-4 px-4 pb-4">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs uppercase">Contato</p>
        <p className="text-sm font-medium">
          {activeConversation?.name ?? "Nenhum contato selecionado"}
        </p>
        <p className="text-muted-foreground text-xs">
          {contactProfile?.phoneNumber ?? "--"}
        </p>
      </div>

      <div className="space-y-2">
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

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-contact-notes`}>Anotações</Label>
        <Textarea
          id={`${idPrefix}-contact-notes`}
          placeholder="Ex.: paciente já enviou exames, prefere atendimento às quartas..."
          rows={8}
          value={notesDraft}
          disabled={!activeConversation || isLoadingProfile}
          onChange={(event) => setNotesDraft(event.target.value)}
        />
      </div>

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
              <div className="border-border/70 flex shrink-0 items-center justify-between gap-3 border-b px-2 py-3 md:px-3">
                <div className="flex min-w-0 items-start gap-2">
                  <SidebarTrigger className="mt-0.5 md:hidden" />
                  <Separator orientation="vertical" className="my-0.5 h-6 md:hidden" />
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold tracking-tight md:text-base">
                      {activeConversation?.name ?? "Nenhuma conversa selecionada"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "rounded-full border-0 px-2 py-0.5 text-[11px]",
                          funnelTone,
                        )}
                      >
                        Funil: {funnelStageLabels[currentFunnelStage]}
                      </Badge>
                      <p className="text-muted-foreground truncate text-[11px]">
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
                      className="h-8 px-2.5 text-[11px] md:h-9 md:px-3 md:text-sm xl:hidden"
                      disabled={!activeConversation}
                    >
                      Perfil
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-full sm:max-w-md xl:hidden"
                  >
                    <SheetHeader>
                      <SheetTitle>Perfil do contato</SheetTitle>
                      <SheetDescription>
                        Atualize o funil de vendas e registre anotações de
                        consulta oftalmologia.
                      </SheetDescription>
                    </SheetHeader>
                    {renderContactProfilePanel("mobile")}
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
              <div className="border-border/70 shrink-0 border-b px-4 py-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Perfil do contato
                </h2>
                <p className="text-sm text-muted-foreground">
                  Atualize o funil de vendas e registre anotações de consulta
                  oftalmologia.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pt-4">
                {renderContactProfilePanel("desktop")}
              </div>
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
