export type WahaSessionStatus =
  | "STOPPED"
  | "STARTING"
  | "SCAN_QR"
  | "SCAN_QR_CODE"
  | "WORKING"
  | "FAILED"
  | "UNKNOWN";

export type WahaSession = {
  name: string;
  status: WahaSessionStatus;
  me?: {
    id?: string;
    pushName?: string;
  };
};

export type WahaConversation = {
  id: string;
  name: string;
  unreadCount: number;
  lastMessageAt?: string;
  preview?: string;
  avatarUrl?: string;
  isPinned?: boolean;
  isArchived?: boolean;
};

export type WahaMessage = {
  id: string;
  chatId: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
};

export type WahaEvent = {
  id: string;
  event: string;
  session?: string;
  chatId?: string;
  payload: unknown;
  receivedAt: number;
};
