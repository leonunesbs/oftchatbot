"use client";

import * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import type { ContactProfile, FunnelStage } from "@/lib/contact-profile/types";
import { funnelStageLabels, funnelStages } from "@/lib/contact-profile/types";
import { cn } from "@/lib/utils";
import type { WahaConversation, WahaMessage, WahaSession } from "@/lib/waha/types";

type ConversationsResponse = {
  conversations: WahaConversation[];
};

type MessagesResponse = {
  messages: WahaMessage[];
};

type ContactProfileResponse = {
  profile: ContactProfile;
};

export default function Page() {
  const [session, setSession] = React.useState<WahaSession | null>(null);
  const [conversations, setConversations] = React.useState<WahaConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = React.useState<string | undefined>();
  const [messages, setMessages] = React.useState<WahaMessage[]>([]);
  const [contactProfile, setContactProfile] = React.useState<ContactProfile | null>(null);
  const [notesDraft, setNotesDraft] = React.useState("");
  const [funnelStageDraft, setFunnelStageDraft] = React.useState<FunnelStage>("primeiro-contato");
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [lastSyncAt, setLastSyncAt] = React.useState<Date | null>(null);

  const activeConversation = React.useMemo(
    () => conversations.find((conversation) => conversation.id === selectedChatId),
    [conversations, selectedChatId]
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

  async function loadConversations() {
    setIsLoadingConversations(true);
    try {
      const response = await fetch("/api/chat/conversations", { cache: "no-store" });
      const data = (await response.json()) as ConversationsResponse;
      setConversations(data.conversations);
      setSelectedChatId((current) => current ?? data.conversations[0]?.id);
      setLastSyncAt(new Date());
    } finally {
      setIsLoadingConversations(false);
    }
  }

  async function loadMessages(chatId: string) {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(chatId)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as MessagesResponse;
      setMessages(data.messages);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function loadContactProfile(chatId: string, contactName?: string) {
    setIsLoadingProfile(true);
    try {
      const searchParams = new URLSearchParams({ chatId });
      if (contactName) {
        searchParams.set("contactName", contactName);
      }
      const response = await fetch(`/api/chat/contact-profile?${searchParams.toString()}`, {
        cache: "no-store",
      });
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
    if (!selectedChatId) {
      setContactProfile(null);
      setNotesDraft("");
      setFunnelStageDraft("primeiro-contato");
      return;
    }
    void loadMessages(selectedChatId);
    void loadContactProfile(selectedChatId, activeConversation?.name);
  }, [activeConversation?.name, selectedChatId]);

  React.useEffect(() => {
    const source = new EventSource("/api/realtime/waha-events");

    source.addEventListener("waha-event", (rawEvent) => {
      const event = rawEvent as MessageEvent<string>;
      const parsed = JSON.parse(event.data) as {
        event?: string;
        chatId?: string;
        payload?: Record<string, unknown>;
      };

      if (!parsed.chatId || !selectedChatId || parsed.chatId !== selectedChatId) {
        return;
      }

      const payload = parsed.payload ?? {};
      const text = typeof payload.text === "string" ? payload.text : "";
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
    funnelStageDraft !== (contactProfile?.funnelStage ?? "primeiro-contato") || notesDraft !== (contactProfile?.notes ?? "");

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
        sessionLabel={sessionLabel}
        sessionToneClassName={sessionTone}
      />
      <SidebarInset className="bg-muted/30">
        <div className="flex min-h-0 flex-1 flex-col p-4 md:p-5 lg:p-7">
          <section className="chat-layout flex min-h-0 flex-1 flex-col">
            <div className="border-border/70 flex items-center justify-between gap-3 border-b px-2 py-3 md:px-3">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold tracking-tight md:text-base">
                  {activeConversation?.name ?? "Nenhuma conversa selecionada"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge className={cn("rounded-full border-0 px-2 py-0.5 text-[11px]", funnelTone)}>
                    Funil: {funnelStageLabels[currentFunnelStage]}
                  </Badge>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {activeConversation
                      ? `${messages.length} ${messages.length === 1 ? "mensagem" : "mensagens"} • ${
                          lastSyncAt ? `Atualizado ${lastSyncAt.toLocaleTimeString()}` : "Sem sincronização"
                        }`
                      : "Escolha uma conversa na barra lateral"}
                  </p>
                </div>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-[11px] md:h-9 md:px-3 md:text-sm"
                    disabled={!activeConversation}
                  >
                    Perfil
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Perfil do contato</SheetTitle>
                    <SheetDescription>
                      Atualize o funil de vendas e registre anotações de consulta oftalmologia.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-4 px-4 pb-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase">Contato</p>
                      <p className="text-sm font-medium">{activeConversation?.name ?? "Nenhum contato selecionado"}</p>
                      <p className="text-muted-foreground text-xs">{contactProfile?.phoneNumber ?? "--"}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="funnel-stage">Status do funil</Label>
                      <Select
                        value={funnelStageDraft}
                        onValueChange={(value) => setFunnelStageDraft(value as FunnelStage)}
                        disabled={!activeConversation || isLoadingProfile}
                      >
                        <SelectTrigger id="funnel-stage" className="w-full">
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
                      <Label htmlFor="contact-notes">Anotações</Label>
                      <Textarea
                        id="contact-notes"
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
                        disabled={!activeConversation || isLoadingProfile || isSavingProfile || !isContactProfileDirty}
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
                </SheetContent>
              </Sheet>
            </div>

            <div className="min-h-0 flex-1">
              <ChatThread activeConversation={activeConversation} messages={messages} isLoading={isLoadingMessages} />
            </div>
            <ChatComposer disabled={!selectedChatId} onSend={handleSend} />
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}