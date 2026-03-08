import { serverEnv } from "@/lib/env/server";
import type { AvailableDateOption, EventTypeOption, SlotOption } from "@/lib/lumi/types";

type SlotSearchInput = {
  eventTypeId?: string;
  location: string;
  consultationType: string;
  dateIso?: string;
  period?: "manha" | "tarde" | "noite";
};

type BookInput = {
  slotId: string;
  eventTypeId?: string;
  fullName: string;
  phone: string;
  email?: string;
  location: string;
  consultationType: string;
};

type StripeCodes = {
  checkoutSessionId?: string;
  paymentIntentId?: string;
  customerId?: string;
  invoiceId?: string;
  subscriptionId?: string;
  paymentLinkId?: string;
};

type BookingStatusResult = {
  paymentStatusText: string;
  bookingStatusText: string;
  paymentUrl?: string;
  source: "cache";
};

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

function formatDateLabel(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00-03:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Fortaleza",
  }).format(date);
}

function buildMockEventTypes(input: { location: string; consultationType: string }): EventTypeOption[] {
  return [
    {
      id: "oftagenda-event-type",
      title: `Consulta ${input.consultationType}`,
      slug: "consulta-geral",
      locationLabel: input.location,
    },
  ];
}

function buildMockAvailableDates(): AvailableDateOption[] {
  const result: AvailableDateOption[] = [];
  const now = new Date();
  for (let index = 1; index <= 30 && result.length < 7; index += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + index);
    const day = date.getDay();
    if (day === 0) {
      continue;
    }
    const isoDate = date.toISOString().slice(0, 10);
    result.push({
      isoDate,
      label: formatDateLabel(isoDate),
      source: "mock",
    });
  }
  return result;
}

function buildMockSlots(input: SlotSearchInput): SlotOption[] {
  const baseDate = input.dateIso
    ? new Date(`${input.dateIso}T00:00:00-03:00`)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);
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

function buildOftagendaUrl(input: BookInput) {
  const configuredBase = (serverEnv.OFTAGENDA_BOOKING_URL ?? "").trim();
  const fallbackBase = "https://agenda.oftleonardo.com.br/agendar";
  const base = configuredBase || fallbackBase;
  const url = new URL(base);

  // Never send users to localhost from WhatsApp links.
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    url.protocol = "https:";
    url.hostname = "agenda.oftleonardo.com.br";
    url.port = "";
    url.pathname = "/agendar";
  }

  // Keep the WhatsApp link compact and user-friendly.
  // We only prefill essential contact fields and avoid empty params.
  const fullName = (input.fullName ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();

  // Keep attribution params for GTM/analytics consistency.
  url.searchParams.set("utm_source", "oftchatbot");
  url.searchParams.set("utm_medium", "whatsapp");

  if (fullName) {
    url.searchParams.set("name", fullName);
  }
  if (phone) {
    url.searchParams.set("phone", phone);
  }
  if (email) {
    url.searchParams.set("email", email);
  }

  return url.toString();
}

export const oftagendaAdapter = {
  async getEventTypes(input: { location: string; consultationType: string }) {
    const eventTypes = buildMockEventTypes(input);
    return {
      eventTypes,
      selectedEventTypeId: eventTypes[0]?.id,
    };
  },

  async getAvailableDates(_input: { eventTypeId: string }) {
    return buildMockAvailableDates();
  },

  async getSlots(input: SlotSearchInput): Promise<SlotOption[]> {
    return buildMockSlots(input);
  },

  async book(input: BookInput): Promise<{
    protocol?: string;
    source: "oftagenda_link";
    paymentUrl?: string;
    stripeCodes?: StripeCodes;
  }> {
    return {
      source: "oftagenda_link",
      paymentUrl: buildOftagendaUrl(input),
    };
  },

  async getBookingStatus(input: {
    protocol?: string;
    paymentUrl?: string;
    stripeCodes?: StripeCodes;
  }): Promise<BookingStatusResult> {
    return {
      paymentStatusText: "não aplicável (fluxo por link)",
      bookingStatusText: "aguardando conclusão no link de agendamento",
      paymentUrl: input.paymentUrl,
      source: "cache",
    };
  },
};
