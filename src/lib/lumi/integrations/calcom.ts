import { serverEnv } from "@/lib/env/server";
import type { SlotOption } from "@/lib/lumi/types";

type SlotSearchInput = {
  location: string;
  consultationType: string;
  dateIso?: string;
  period?: "manha" | "tarde" | "noite";
};

type BookInput = {
  slotId: string;
  fullName: string;
  phone: string;
  email?: string;
  location: string;
  consultationType: string;
};

let cachedEventTypeId: string | null = null;

function periodHourRange(period?: "manha" | "tarde" | "noite") {
  if (period === "manha") {
    return { min: 8, max: 12 };
  }
  if (period === "tarde") {
    return { min: 13, max: 17 };
  }
  if (period === "noite") {
    return { min: 18, max: 21 };
  }
  return { min: 8, max: 18 };
}

function formatSlotLabel(startAt: string, location: string, consultationType: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  });
  return `${formatter.format(new Date(startAt))} - ${location} (${consultationType})`;
}

function buildMockSlots(input: SlotSearchInput): SlotOption[] {
  const baseDate = input.dateIso ? new Date(`${input.dateIso}T00:00:00-03:00`) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const range = periodHourRange(input.period);
  const mockHours = [range.min, Math.min(range.min + 2, range.max), Math.min(range.min + 4, range.max)];

  return mockHours.map((hour, index) => {
    const start = new Date(baseDate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const startAt = start.toISOString();
    return {
      id: `mock-${startAt}-${index}`,
      startAt,
      endAt: end.toISOString(),
      label: formatSlotLabel(startAt, input.location, input.consultationType),
      location: input.location,
      consultationType: input.consultationType,
      source: "mock",
    };
  });
}

function normalizeCalSlots(rawSlots: unknown, input: SlotSearchInput): SlotOption[] {
  if (!Array.isArray(rawSlots)) {
    return [];
  }

  const normalized = rawSlots
    .map((slot, index) => {
      if (!slot || typeof slot !== "object") {
        return undefined;
      }
      const source = slot as Record<string, unknown>;
      const startAt = typeof source.start === "string" ? source.start : typeof source.startAt === "string" ? source.startAt : undefined;
      const endAt = typeof source.end === "string" ? source.end : typeof source.endAt === "string" ? source.endAt : undefined;
      if (!startAt || !endAt) {
        return undefined;
      }
      const id =
        typeof source.id === "string"
          ? source.id
          : typeof source.uid === "string"
            ? source.uid
            : `cal-${startAt}-${index}`;

      const normalizedSlot: SlotOption = {
        id,
        startAt,
        endAt,
        label: formatSlotLabel(startAt, input.location, input.consultationType),
        location: input.location,
        consultationType: input.consultationType,
        source: "calcom",
      };
      return normalizedSlot;
    })
    .filter((slot): slot is SlotOption => Boolean(slot));

  return normalized;
}

function extractEventTypeId(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const source = raw as Record<string, unknown>;
  if (typeof source.id === "number" || typeof source.id === "string") {
    return String(source.id);
  }
  if (typeof source.eventTypeId === "number" || typeof source.eventTypeId === "string") {
    return String(source.eventTypeId);
  }
  return undefined;
}

async function getAvailableEventTypeId(endpoint: string, apiKey: string) {
  if (cachedEventTypeId) {
    return cachedEventTypeId;
  }

  try {
    const url = new URL(`${endpoint.replace(/\/$/, "")}/event-types`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      return undefined;
    }

    const body = (await response.json()) as Record<string, unknown>;
    const candidates = Array.isArray(body.event_types)
      ? body.event_types
      : Array.isArray(body.eventTypes)
        ? body.eventTypes
        : Array.isArray(body.data)
          ? body.data
          : [];
    const firstId = candidates.map((candidate) => extractEventTypeId(candidate)).find(Boolean);
    if (!firstId) {
      return undefined;
    }
    cachedEventTypeId = firstId;
    return firstId;
  } catch {
    return undefined;
  }
}

export const calComAdapter = {
  async getSlots(input: SlotSearchInput): Promise<SlotOption[]> {
    const apiKey = serverEnv.CALCOM_API_KEY;
    const endpoint = serverEnv.CALCOM_API_BASE_URL;

    if (!apiKey || !endpoint) {
      return buildMockSlots(input);
    }

    try {
      const eventTypeId = await getAvailableEventTypeId(endpoint, apiKey);
      if (!eventTypeId) {
        return buildMockSlots(input);
      }
      const url = new URL(`${endpoint.replace(/\/$/, "")}/slots`);
      url.searchParams.set("eventTypeId", eventTypeId);
      if (input.dateIso) {
        url.searchParams.set("date", input.dateIso);
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return buildMockSlots(input);
      }

      const body = (await response.json()) as Record<string, unknown>;
      const slots = normalizeCalSlots(body.slots ?? body.data, input);
      return slots.length > 0 ? slots : buildMockSlots(input);
    } catch {
      return buildMockSlots(input);
    }
  },

  async book(input: BookInput): Promise<{ protocol: string; source: "calcom" | "mock" }> {
    const apiKey = serverEnv.CALCOM_API_KEY;
    const endpoint = serverEnv.CALCOM_API_BASE_URL;

    if (!apiKey || !endpoint) {
      return {
        protocol: `LUMI-MOCK-${Math.floor(Date.now() / 1000)}`,
        source: "mock",
      };
    }

    try {
      const eventTypeId = await getAvailableEventTypeId(endpoint, apiKey);
      if (!eventTypeId) {
        return {
          protocol: `LUMI-MOCK-${Math.floor(Date.now() / 1000)}`,
          source: "mock",
        };
      }
      const url = new URL(`${endpoint.replace(/\/$/, "")}/bookings`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventTypeId,
          slotId: input.slotId,
          name: input.fullName,
          email: input.email ?? "sem-email@local.invalid",
          metadata: {
            phone: input.phone,
            location: input.location,
            consultationType: input.consultationType,
          },
        }),
      });

      if (!response.ok) {
        return {
          protocol: `LUMI-MOCK-${Math.floor(Date.now() / 1000)}`,
          source: "mock",
        };
      }

      const body = (await response.json()) as Record<string, unknown>;
      const protocol =
        typeof body.uid === "string"
          ? body.uid
          : typeof body.id === "string"
            ? body.id
            : typeof body.reference === "string"
              ? body.reference
              : `LUMI-CAL-${Math.floor(Date.now() / 1000)}`;

      return {
        protocol,
        source: "calcom",
      };
    } catch {
      return {
        protocol: `LUMI-MOCK-${Math.floor(Date.now() / 1000)}`,
        source: "mock",
      };
    }
  },
};
