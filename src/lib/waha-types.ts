/**
 * Tipos partilhados para métricas e listagens no painel (hooks CRM/dashboard).
 * Integrações WAHA via HTTP usam `@/lib/waha/types`.
 */

export type ConversationStatus = "open" | "pending" | "closed";

export type ConversationSummary = {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  avatarUrl?: string;
  status: ConversationStatus;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  body: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
  status: "sent" | "delivered" | "read" | "pending" | "failed";
};

export type DashboardMetrics = {
  totalConversations: number;
  pendingConversations: number;
  unreadMessages: number;
  avgResponseMinutes: number;
};

/** Estágio de pipeline CRM (legado + funil). */
export type PipelineStage = string;

export type CrmChatMeta = {
  chatId: string;
  stage: PipelineStage;
  notes: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  about?: string;
  tags: string[];
  email?: string;
  preferredLocation?: string;
  appointment: unknown | null;
};
