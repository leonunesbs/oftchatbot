import { z } from "zod/v4";

export const wahaSessionSchema = z.object({
  name: z.string().default("default"),
  status: z
    .enum(["STOPPED", "STARTING", "SCAN_QR", "SCAN_QR_CODE", "WORKING", "FAILED", "UNKNOWN"])
    .catch("UNKNOWN")
    .default("UNKNOWN"),
  me: z
    .object({
      id: z.string().optional(),
      pushName: z.string().optional(),
    })
    .nullable()
    .optional()
    .transform((value) => value ?? undefined),
});

export const wahaConversationSchema = z.object({
  id: z.string(),
  name: z.string().default("Unknown contact"),
  unreadCount: z.number().int().nonnegative().default(0),
  lastMessageAt: z.string().optional(),
  preview: z.string().optional(),
  avatarUrl: z.string().optional(),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
});

export const wahaMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  fromMe: z.boolean().default(false),
  text: z.string().default(""),
  timestamp: z.number().int().default(0),
});

export const wahaEventSchema = z.object({
  id: z.string(),
  event: z.string(),
  session: z.string().optional(),
  chatId: z.string().optional(),
  payload: z.unknown(),
  receivedAt: z.number().int(),
});

export const sendTextInputSchema = z.object({
  chatId: z.string().min(5),
  text: z.string().min(1),
  session: z.string().min(1).optional(),
});
