import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { ContactProfile, FunnelStage } from "@/lib/contact-profile/types";
import { normalizeFunnelStage } from "@/lib/contact-profile/types";
import { serverEnv } from "@/lib/env/server";

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
      funnel_stage TEXT NOT NULL DEFAULT 'primeiro-contato',
      notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);

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
    funnelStage: "primeiro-contato",
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

type ContactProfileRow = Omit<ContactProfile, "funnelStage"> & {
  funnelStage: string;
};

export const contactProfileStore = {
  get(chatId: string, defaultName?: string): ContactProfile {
    const statement = getDb().prepare(`
      SELECT
        chat_id AS chatId,
        contact_name AS contactName,
        phone_number AS phoneNumber,
        funnel_stage AS funnelStage,
        notes,
        updated_at AS updatedAt
      FROM contact_profiles
      WHERE chat_id = ?
      LIMIT 1
    `);

    const result = statement.get(chatId) as ContactProfileRow | undefined;
    if (!result) {
      return fallbackProfile(chatId, defaultName);
    }

    return {
      ...result,
      funnelStage: normalizeFunnelStage(result.funnelStage),
    };
  },

  upsert(input: { chatId: string; contactName?: string; funnelStage: FunnelStage; notes: string }): ContactProfile {
    const existing = this.get(input.chatId, input.contactName);
    const nextProfile: ContactProfile = {
      ...existing,
      contactName: input.contactName?.trim() || existing.contactName,
      phoneNumber: existing.phoneNumber,
      funnelStage: input.funnelStage,
      notes: input.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    const statement = getDb().prepare(`
      INSERT INTO contact_profiles (chat_id, contact_name, phone_number, funnel_stage, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        contact_name = excluded.contact_name,
        phone_number = excluded.phone_number,
        funnel_stage = excluded.funnel_stage,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `);

    statement.run(
      nextProfile.chatId,
      nextProfile.contactName,
      nextProfile.phoneNumber,
      nextProfile.funnelStage,
      nextProfile.notes,
      nextProfile.updatedAt
    );

    return nextProfile;
  },
};
