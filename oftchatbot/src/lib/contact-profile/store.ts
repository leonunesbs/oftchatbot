import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { ContactProfile, FunnelStage } from "@/lib/contact-profile/types";
import { normalizeFunnelStage } from "@/lib/contact-profile/types";
import { serverEnv } from "@/lib/env/server";
import { lumiIntents } from "@/lib/lumi/types";
import type { LumiIntent, LumiSession, LumiState } from "@/lib/lumi/types";

const DEFAULT_DB_PATH = ".data/contact-profiles.sqlite";
const dbPath = serverEnv.WAHA_CONTACTS_DB_PATH ?? DEFAULT_DB_PATH;

function ensureDbDirectory() {
  mkdirSync(dirname(dbPath), { recursive: true });
}

let db: DatabaseSync | null = null;

function getDb() {
  if (db) {
    return db;
  }

  ensureDbDirectory();
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_profiles (
      chat_id TEXT PRIMARY KEY,
      contact_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      avatar_url TEXT,
      push_name TEXT,
      short_name TEXT,
      business_name TEXT,
      about TEXT,
      is_business INTEGER NOT NULL DEFAULT 0,
      is_my_contact INTEGER NOT NULL DEFAULT 0,
      raw_details TEXT NOT NULL DEFAULT '{}',
      funnel_stage TEXT NOT NULL DEFAULT 'primeiro-contato',
      notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS lumi_sessions (
      chat_id TEXT PRIMARY KEY,
      state TEXT NOT NULL DEFAULT 'START',
      collected_json TEXT NOT NULL DEFAULT '{}',
      validation_failures INTEGER NOT NULL DEFAULT 0,
      handoff_active INTEGER NOT NULL DEFAULT 0,
      last_intent TEXT,
      last_interaction_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  const columnRows = db.prepare("PRAGMA table_info(contact_profiles)").all() as Array<{ name?: unknown }>;
  const columns = new Set(columnRows.map((row) => (typeof row.name === "string" ? row.name : "")).filter(Boolean));
  const migrations: Array<{ column: string; sql: string }> = [
    { column: "avatar_url", sql: "ALTER TABLE contact_profiles ADD COLUMN avatar_url TEXT" },
    { column: "push_name", sql: "ALTER TABLE contact_profiles ADD COLUMN push_name TEXT" },
    { column: "short_name", sql: "ALTER TABLE contact_profiles ADD COLUMN short_name TEXT" },
    { column: "business_name", sql: "ALTER TABLE contact_profiles ADD COLUMN business_name TEXT" },
    { column: "about", sql: "ALTER TABLE contact_profiles ADD COLUMN about TEXT" },
    { column: "is_business", sql: "ALTER TABLE contact_profiles ADD COLUMN is_business INTEGER NOT NULL DEFAULT 0" },
    { column: "is_my_contact", sql: "ALTER TABLE contact_profiles ADD COLUMN is_my_contact INTEGER NOT NULL DEFAULT 0" },
    { column: "raw_details", sql: "ALTER TABLE contact_profiles ADD COLUMN raw_details TEXT NOT NULL DEFAULT '{}'" },
  ];

  for (const migration of migrations) {
    if (!columns.has(migration.column)) {
      db.exec(migration.sql);
    }
  }

  return db;
}

function normalizePhone(chatId: string) {
  return chatId.replace(/@.+$/, "");
}

function fallbackProfile(chatId: string, contactName?: string): ContactProfile {
  return {
    chatId,
    contactName: contactName?.trim() || "Contato",
    phoneNumber: normalizePhone(chatId),
    avatarUrl: undefined,
    pushName: undefined,
    shortName: undefined,
    businessName: undefined,
    about: undefined,
    isBusiness: false,
    isMyContact: false,
    rawDetails: {},
    funnelStage: "primeiro-contato",
    notes: "",
    lumiSession: undefined,
    updatedAt: new Date().toISOString(),
  };
}

type ContactProfileRow = {
  chatId: string;
  contactName: string;
  phoneNumber: string;
  avatarUrl?: string;
  pushName?: string;
  shortName?: string;
  businessName?: string;
  about?: string;
  funnelStage: string;
  isBusiness?: number | boolean;
  isMyContact?: number | boolean;
  rawDetails?: string | Record<string, unknown>;
  notes: string;
  updatedAt: string;
};

type LumiSessionRow = {
  chatId: string;
  state: string;
  collectedJson?: string | Record<string, unknown>;
  validationFailures: number;
  handoffActive?: number | boolean;
  lastIntent?: string;
  lastInteractionAt: string;
  updatedAt: string;
};

function normalizeRawDetails(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  return {};
}

function normalizeSqliteBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
}

function normalizeState(value: unknown): LumiState {
  if (typeof value === "string" && value.trim().length > 0) {
    return value as LumiState;
  }
  return "START";
}

function normalizeIntent(value: unknown): LumiIntent | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return lumiIntents.includes(value as LumiIntent) ? (value as LumiIntent) : undefined;
}

function sanitizeLumiCollectedForStorage(collected: LumiSession["collected"]) {
  if (!collected || typeof collected !== "object") {
    return {};
  }
  const { phone: _phone, ...rest } = collected as Record<string, unknown>;
  return rest;
}

export const contactProfileStore = {
  get(chatId: string, defaultName?: string): ContactProfile {
    const statement = getDb().prepare(`
      SELECT
        chat_id AS chatId,
        contact_name AS contactName,
        phone_number AS phoneNumber,
        avatar_url AS avatarUrl,
        push_name AS pushName,
        short_name AS shortName,
        business_name AS businessName,
        about,
        is_business AS isBusiness,
        is_my_contact AS isMyContact,
        raw_details AS rawDetails,
        funnel_stage AS funnelStage,
        notes,
        updated_at AS updatedAt
      FROM contact_profiles
      WHERE chat_id = ?
      LIMIT 1
    `);

    const result = statement.get(chatId) as ContactProfileRow | undefined;
    const lumiSession = this.getLumiSession(chatId) ?? undefined;
    if (!result) {
      return {
        ...fallbackProfile(chatId, defaultName),
        lumiSession,
      };
    }

    return {
      ...result,
      isBusiness: normalizeSqliteBoolean(result.isBusiness),
      isMyContact: normalizeSqliteBoolean(result.isMyContact),
      rawDetails: normalizeRawDetails(result.rawDetails),
      funnelStage: normalizeFunnelStage(result.funnelStage),
      lumiSession,
    };
  },

  upsert(input: {
    chatId: string;
    contactName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    pushName?: string;
    shortName?: string;
    businessName?: string;
    about?: string;
    isBusiness?: boolean;
    isMyContact?: boolean;
    rawDetails?: Record<string, unknown>;
    funnelStage: FunnelStage;
    notes: string;
  }): ContactProfile {
    const existing = this.get(input.chatId, input.contactName);
    const nextProfile: ContactProfile = {
      ...existing,
      contactName: input.contactName?.trim() || existing.contactName,
      phoneNumber: input.phoneNumber?.trim() || existing.phoneNumber,
      avatarUrl: input.avatarUrl ?? existing.avatarUrl,
      pushName: input.pushName ?? existing.pushName,
      shortName: input.shortName ?? existing.shortName,
      businessName: input.businessName ?? existing.businessName,
      about: input.about ?? existing.about,
      isBusiness: input.isBusiness ?? existing.isBusiness,
      isMyContact: input.isMyContact ?? existing.isMyContact,
      rawDetails: input.rawDetails ?? existing.rawDetails,
      funnelStage: input.funnelStage,
      notes: input.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    const statement = getDb().prepare(`
      INSERT INTO contact_profiles (
        chat_id,
        contact_name,
        phone_number,
        avatar_url,
        push_name,
        short_name,
        business_name,
        about,
        is_business,
        is_my_contact,
        raw_details,
        funnel_stage,
        notes,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        contact_name = excluded.contact_name,
        phone_number = excluded.phone_number,
        avatar_url = excluded.avatar_url,
        push_name = excluded.push_name,
        short_name = excluded.short_name,
        business_name = excluded.business_name,
        about = excluded.about,
        is_business = excluded.is_business,
        is_my_contact = excluded.is_my_contact,
        raw_details = excluded.raw_details,
        funnel_stage = excluded.funnel_stage,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `);

    statement.run(
      nextProfile.chatId,
      nextProfile.contactName,
      nextProfile.phoneNumber,
      nextProfile.avatarUrl ?? null,
      nextProfile.pushName ?? null,
      nextProfile.shortName ?? null,
      nextProfile.businessName ?? null,
      nextProfile.about ?? null,
      nextProfile.isBusiness ? 1 : 0,
      nextProfile.isMyContact ? 1 : 0,
      JSON.stringify(nextProfile.rawDetails ?? {}),
      nextProfile.funnelStage,
      nextProfile.notes,
      nextProfile.updatedAt
    );

    return {
      ...nextProfile,
      lumiSession: this.getLumiSession(input.chatId) ?? undefined,
    };
  },
  getLumiSession(chatId: string): LumiSession | null {
    const statement = getDb().prepare(`
      SELECT
        chat_id AS chatId,
        state,
        collected_json AS collectedJson,
        validation_failures AS validationFailures,
        handoff_active AS handoffActive,
        last_intent AS lastIntent,
        last_interaction_at AS lastInteractionAt,
        updated_at AS updatedAt
      FROM lumi_sessions
      WHERE chat_id = ?
      LIMIT 1
    `);

    const result = statement.get(chatId) as LumiSessionRow | undefined;
    if (!result) {
      return null;
    }

    return {
      chatId: result.chatId,
      state: normalizeState(result.state),
      collected: sanitizeLumiCollectedForStorage(normalizeRawDetails(result.collectedJson)) as LumiSession["collected"],
      validationFailures: Number(result.validationFailures) || 0,
      handoffActive: normalizeSqliteBoolean(result.handoffActive),
      lastIntent: normalizeIntent(result.lastIntent),
      lastInteractionAt: result.lastInteractionAt,
      updatedAt: result.updatedAt,
    };
  },
  upsertLumiSession(input: LumiSession): LumiSession {
    const statement = getDb().prepare(`
      INSERT INTO lumi_sessions (
        chat_id,
        state,
        collected_json,
        validation_failures,
        handoff_active,
        last_intent,
        last_interaction_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        state = excluded.state,
        collected_json = excluded.collected_json,
        validation_failures = excluded.validation_failures,
        handoff_active = excluded.handoff_active,
        last_intent = excluded.last_intent,
        last_interaction_at = excluded.last_interaction_at,
        updated_at = excluded.updated_at
    `);

    statement.run(
      input.chatId,
      input.state,
      JSON.stringify(sanitizeLumiCollectedForStorage(input.collected)),
      Math.max(0, Math.floor(input.validationFailures)),
      input.handoffActive ? 1 : 0,
      input.lastIntent ?? null,
      input.lastInteractionAt,
      input.updatedAt
    );

    return input;
  },
  clearLumiSession(chatId: string) {
    const statement = getDb().prepare("DELETE FROM lumi_sessions WHERE chat_id = ?");
    statement.run(chatId);
  },
};
