import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { funnelStages } from "@/lib/contact-profile/types";
import { contactProfileStore } from "@/lib/contact-profile/store";
import { serverEnv } from "@/lib/env/server";
import { requestWaha, WahaHttpError } from "@/lib/waha/http-client";

export const runtime = "nodejs";

const updateContactProfileSchema = z.object({
  chatId: z.string().min(5),
  contactName: z.string().trim().optional(),
  funnelStage: z.enum(funnelStages),
  notes: z.string().max(5000).default(""),
});
const clearContactProfileSchema = z.object({
  chatId: z.string().min(5),
  contactName: z.string().trim().optional(),
});

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function asFirstRecord(value: unknown) {
  if (Array.isArray(value) && value.length > 0) {
    return asRecord(value[0]);
  }
  return asRecord(value);
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function normalizePhoneFromChatId(chatId: string) {
  return chatId.replace(/@.+$/, "");
}

function normalizePhoneValue(value: unknown) {
  const candidate = asString(value);
  if (!candidate) {
    return undefined;
  }

  const withoutSuffix = candidate.replace(/@.+$/, "");
  const digitsOnly = withoutSuffix.replace(/\D+/g, "");
  return digitsOnly.length > 5 ? digitsOnly : undefined;
}

function extractPhoneNumber(source: Record<string, unknown>, fallbackChatId: string) {
  const nestedId = asRecord(source.id);
  const nestedWid = asRecord(source.wid);
  const nestedPhone = asRecord(source.phone);

  const candidates: unknown[] = [
    source.phoneNumber,
    source.number,
    source.phone,
    source.phoneId,
    source.id,
    source.user,
    source.jid,
    nestedId?._serialized,
    nestedId?.id,
    nestedId?.user,
    nestedWid?._serialized,
    nestedWid?.id,
    nestedWid?.user,
    nestedPhone?.number,
    nestedPhone?.id,
    nestedPhone?.user,
  ];

  for (const candidate of candidates) {
    const normalized = normalizePhoneValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return normalizePhoneFromChatId(fallbackChatId);
}

function pickAvatarUrl(source?: Record<string, unknown>) {
  if (!source) {
    return undefined;
  }
  const nestedPicture = asRecord(source.picture);
  const profileThumb = asRecord(source.profilePicThumbObj);

  return (
    asString(source.avatarUrl) ??
    asString(source.avatar) ??
    asString(source.photo) ??
    asString(source.picture) ??
    asString(nestedPicture?.url) ??
    asString(source.profilePictureUrl) ??
    asString(source.url) ??
    asString(profileThumb?.eurl) ??
    asString(profileThumb?.img)
  );
}

async function tryFetchContactByPath(path: string) {
  try {
    const response = await requestWaha({
      path,
      method: "GET",
      searchParams: {
        session: serverEnv.WAHA_DEFAULT_SESSION,
      },
    });
    const body = asFirstRecord(response.body);
    return body;
  } catch (error) {
    if (error instanceof WahaHttpError && [400, 404].includes(error.status)) {
      return undefined;
    }
    return undefined;
  }
}

async function fetchWahaContact(chatId: string) {
  const phone = normalizePhoneFromChatId(chatId);
  const pathCandidates = [
    `${serverEnv.WAHA_DEFAULT_SESSION}/contacts/${encodeURIComponent(chatId)}`,
    `${serverEnv.WAHA_DEFAULT_SESSION}/contacts/${encodeURIComponent(phone)}`,
    `contacts/${encodeURIComponent(chatId)}`,
    `contacts/${encodeURIComponent(phone)}`,
  ];

  for (const path of pathCandidates) {
    const result = await tryFetchContactByPath(path);
    if (result) {
      return result;
    }
  }

  return undefined;
}

async function collectContactDetails(chatId: string, defaultName?: string) {
  const source = await fetchWahaContact(chatId);
  if (!source) {
    return undefined;
  }

  const nestedContact =
    asRecord(source.contact) ??
    asRecord(source._contact) ??
    asRecord(source.data) ??
    asRecord(source._data);
  const nestedBusiness = asRecord(source.businessProfile) ?? asRecord(nestedContact?.businessProfile);
  const raw = nestedContact ?? source;
  const phone = normalizePhoneFromChatId(chatId);

  return {
    contactName:
      asString(raw.name) ??
      asString(raw.pushName) ??
      asString(raw.shortName) ??
      asString(raw.formattedName) ??
      defaultName,
    phoneNumber: extractPhoneNumber(raw, chatId),
    avatarUrl: pickAvatarUrl(raw),
    pushName: asString(raw.pushName),
    shortName: asString(raw.shortName),
    businessName:
      asString(raw.businessName) ??
      asString(raw.verifiedName) ??
      asString(raw.companyName) ??
      asString(nestedBusiness?.name),
    about: asString(raw.about) ?? asString(raw.status) ?? asString(nestedBusiness?.description),
    isBusiness:
      asBoolean(raw.isBusiness) ??
      asBoolean(raw.business) ??
      Boolean(nestedBusiness),
    isMyContact:
      asBoolean(raw.isMyContact) ??
      asBoolean(raw.isContact) ??
      asBoolean(raw.inAddressBook) ??
      false,
    rawDetails: source,
  };
}

export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chatId");
  const contactName = request.nextUrl.searchParams.get("contactName") ?? undefined;

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const profile = contactProfileStore.get(chatId, contactName);

  const details = await collectContactDetails(chatId, contactName);
  if (!details) {
    return NextResponse.json({ profile });
  }

  const enrichedProfile = contactProfileStore.upsert({
    chatId,
    contactName: details.contactName,
    phoneNumber: details.phoneNumber,
    avatarUrl: details.avatarUrl,
    pushName: details.pushName,
    shortName: details.shortName,
    businessName: details.businessName,
    about: details.about,
    isBusiness: details.isBusiness,
    isMyContact: details.isMyContact,
    rawDetails: details.rawDetails,
    funnelStage: profile.funnelStage,
    notes: profile.notes,
  });
  return NextResponse.json({ profile: enrichedProfile });
}

export async function PUT(request: NextRequest) {
  const payload = await request.json();
  const parsed = updateContactProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const profile = contactProfileStore.upsert(parsed.data);
  return NextResponse.json({ profile });
}

export async function DELETE(request: NextRequest) {
  const payload = await request.json();
  const parsed = clearContactProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { chatId, contactName } = parsed.data;
  contactProfileStore.clearContactData(chatId);
  const profile = contactProfileStore.get(chatId, contactName);
  return NextResponse.json({ profile });
}
