import { serverEnv } from '@/lib/env/server';
import type { AvailableDateOption, EventTypeOption, SlotOption } from '@/lib/lumi/types';

type SlotSearchInput = {
  eventTypeId?: string;
  location: string;
  consultationType: string;
  dateIso?: string;
  period?: 'manha' | 'tarde' | 'noite';
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
  source: 'stripe' | 'cache';
};

let cachedEventTypeId: string | null = null;

const CAL_API_VERSION = {
  eventTypes: '2024-06-14',
  slots: '2024-09-04',
  bookings: '2024-08-13',
} as const;

function normalizeText(input: string) {
  return input
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function endpointV2(endpoint: string) {
  const base = endpoint.replace(/\/$/, '');
  return base.endsWith('/v2') ? base : `${base}/v2`;
}

function periodHourRange(period?: 'manha' | 'tarde' | 'noite') {
  if (period === 'manha') {
    return { min: 8, max: 12 };
  }
  if (period === 'tarde') {
    return { min: 13, max: 17 };
  }
  if (period === 'noite') {
    return { min: 18, max: 21 };
  }
  return { min: 8, max: 18 };
}

function formatSlotLabel(startAt: string, location: string, consultationType: string) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Fortaleza',
  });
  return `${formatter.format(new Date(startAt))} - ${location} (${consultationType})`;
}

function formatDateLabel(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00-03:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Fortaleza',
  }).format(date);
}

function buildMockEventTypes(input: { location: string; consultationType: string }): EventTypeOption[] {
  return [
    {
      id: 'mock-event-type',
      title: `Consulta ${input.consultationType}`,
      slug: 'consulta-geral',
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
      source: 'mock',
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
      source: 'mock',
    };
  });
}

function normalizeCalSlots(rawSlots: unknown, input: SlotSearchInput): SlotOption[] {
  if (!Array.isArray(rawSlots)) {
    return [];
  }

  const normalized = rawSlots
    .map((slot, index) => {
      if (!slot || typeof slot !== 'object') {
        return undefined;
      }
      const source = slot as Record<string, unknown>;
      const startAt =
        typeof source.start === 'string'
          ? source.start
          : typeof source.startAt === 'string'
            ? source.startAt
            : undefined;
      const endAt =
        typeof source.end === 'string' ? source.end : typeof source.endAt === 'string' ? source.endAt : undefined;
      if (!startAt || !endAt) {
        return undefined;
      }
      const id =
        typeof source.id === 'string'
          ? source.id
          : typeof source.uid === 'string'
            ? source.uid
            : `cal-${startAt}-${index}`;

      const normalizedSlot: SlotOption = {
        id,
        startAt,
        endAt,
        label: formatSlotLabel(startAt, input.location, input.consultationType),
        location: input.location,
        consultationType: input.consultationType,
        source: 'calcom',
      };
      return normalizedSlot;
    })
    .filter((slot): slot is SlotOption => Boolean(slot));

  return normalized;
}

function normalizeCalSlotsByDate(
  rawSlotsByDate: unknown,
  input: SlotSearchInput,
  selectedDateIso?: string,
): SlotOption[] {
  if (!rawSlotsByDate || typeof rawSlotsByDate !== 'object') {
    return [];
  }
  const dateKey = selectedDateIso;
  if (!dateKey) {
    return [];
  }
  const source = rawSlotsByDate as Record<string, unknown>;
  const daySlots = source[dateKey];
  if (!Array.isArray(daySlots)) {
    return [];
  }

  const normalized: Array<SlotOption | undefined> = daySlots.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return undefined;
    }
    const record = entry as Record<string, unknown>;
    const startAt =
      typeof record.start === 'string' ? record.start : typeof record.startAt === 'string' ? record.startAt : undefined;
    const endAt =
      typeof record.end === 'string' ? record.end : typeof record.endAt === 'string' ? record.endAt : undefined;
    if (!startAt || !endAt) {
      return undefined;
    }
    const slot: SlotOption = {
      id: `cal-${dateKey}-${index}-${startAt}`,
      startAt,
      endAt,
      label: formatSlotLabel(startAt, input.location, input.consultationType),
      location: input.location,
      consultationType: input.consultationType,
      source: 'calcom',
    };
    return slot;
  });
  return normalized.filter((slot): slot is SlotOption => slot !== undefined);
}

function normalizeEventTypes(raw: unknown): EventTypeOption[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const body = raw as Record<string, unknown>;
  const candidates = Array.isArray(body.data)
    ? body.data
    : Array.isArray(body.event_types)
      ? body.event_types
      : Array.isArray(body.eventTypes)
        ? body.eventTypes
        : [];

  const normalized: Array<EventTypeOption | undefined> = candidates.map((candidate) => {
    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }
    const source = candidate as Record<string, unknown>;
    const id = extractEventTypeId(source);
    if (!id) {
      return undefined;
    }
    const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim() : 'Consulta';
    const slug = typeof source.slug === 'string' && source.slug.trim() ? source.slug.trim() : undefined;
    const locations = Array.isArray(source.locations) ? source.locations : [];
    let locationLabel: string | undefined;
    for (const locationEntry of locations) {
      if (!locationEntry || typeof locationEntry !== 'object') {
        continue;
      }
      const location = locationEntry as Record<string, unknown>;
      const fields = [location.label, location.address, location.value, location.name];
      const field = fields.find((item) => typeof item === 'string' && item.trim()) as string | undefined;
      if (field) {
        locationLabel = field.trim();
        break;
      }
    }
    return { id, title, slug, locationLabel };
  });
  return normalized.filter((eventType): eventType is EventTypeOption => eventType !== undefined);
}

function pickBestEventType(eventTypes: EventTypeOption[], input: { location: string; consultationType: string }) {
  if (eventTypes.length === 0) {
    return undefined;
  }
  const location = normalizeText(input.location);
  const consultationType = normalizeText(input.consultationType);

  return (
    eventTypes.find((eventType) => {
      const text = normalizeText(`${eventType.title} ${eventType.slug ?? ''} ${eventType.locationLabel ?? ''}`);
      return text.includes(location) && text.includes(consultationType);
    }) ??
    eventTypes.find((eventType) => {
      const text = normalizeText(`${eventType.title} ${eventType.slug ?? ''} ${eventType.locationLabel ?? ''}`);
      return text.includes(location);
    }) ??
    eventTypes.find((eventType) => {
      const text = normalizeText(`${eventType.title} ${eventType.slug ?? ''} ${eventType.locationLabel ?? ''}`);
      return text.includes(consultationType);
    }) ??
    eventTypes[0]
  );
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseAvailableDates(raw: unknown): AvailableDateOption[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const body = raw as Record<string, unknown>;
  const slotsByDate = body.data ?? body.slots ?? body.slotRanges ?? body.result;
  if (!slotsByDate || typeof slotsByDate !== 'object') {
    return [];
  }

  return Object.entries(slotsByDate as Record<string, unknown>)
    .filter(([, entries]) => Array.isArray(entries) && entries.length > 0)
    .map(([isoDate]) => ({
      isoDate,
      label: formatDateLabel(isoDate),
      source: 'calcom' as const,
    }))
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

function extractEventTypeId(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const source = raw as Record<string, unknown>;
  if (typeof source.id === 'number' || typeof source.id === 'string') {
    return String(source.id);
  }
  if (typeof source.eventTypeId === 'number' || typeof source.eventTypeId === 'string') {
    return String(source.eventTypeId);
  }
  return undefined;
}

function extractUrl(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const source = value as Record<string, unknown>;
  const directCandidates = [
    source.paymentUrl,
    source.paymentURL,
    source.paymentLink,
    source.paymentLinkUrl,
    source.stripePaymentUrl,
    source.checkoutUrl,
    source.url,
  ];
  const direct = directCandidates.find((candidate) => typeof candidate === 'string' && candidate.startsWith('http'));
  if (typeof direct === 'string') {
    return direct;
  }

  const nestedCandidates = [source.payment, source.checkout, source.metadata, source.links];
  for (const nested of nestedCandidates) {
    const nestedResult = extractUrl(nested);
    if (nestedResult) {
      return nestedResult;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function firstMatchFromRegex(value: unknown, regex: RegExp) {
  const source = asString(value);
  if (!source) {
    return undefined;
  }
  const match = source.match(regex);
  return match?.[1];
}

function extractStripeCodesFromUrl(paymentUrl?: string): StripeCodes {
  if (!paymentUrl) {
    return {};
  }

  const codes: StripeCodes = {};
  try {
    const parsed = new URL(paymentUrl);
    const sessionFromQuery =
      parsed.searchParams.get('session_id') ??
      parsed.searchParams.get('checkout_session_id') ??
      parsed.searchParams.get('cs');
    const paymentIntentFromQuery = parsed.searchParams.get('payment_intent');
    const customerFromQuery = parsed.searchParams.get('customer');
    const invoiceFromQuery = parsed.searchParams.get('invoice');
    const subscriptionFromQuery = parsed.searchParams.get('subscription');
    const paymentLinkFromQuery = parsed.searchParams.get('payment_link');
    if (sessionFromQuery) {
      codes.checkoutSessionId = sessionFromQuery;
    }
    if (paymentIntentFromQuery) {
      codes.paymentIntentId = paymentIntentFromQuery;
    }
    if (customerFromQuery) {
      codes.customerId = customerFromQuery;
    }
    if (invoiceFromQuery) {
      codes.invoiceId = invoiceFromQuery;
    }
    if (subscriptionFromQuery) {
      codes.subscriptionId = subscriptionFromQuery;
    }
    if (paymentLinkFromQuery) {
      codes.paymentLinkId = paymentLinkFromQuery;
    }
  } catch {
    // Keep fallback extraction below for non-URL values.
  }

  if (!codes.checkoutSessionId) {
    codes.checkoutSessionId = firstMatchFromRegex(paymentUrl, /(cs_(?:test|live)_[A-Za-z0-9]+)/);
  }
  if (!codes.paymentIntentId) {
    codes.paymentIntentId = firstMatchFromRegex(paymentUrl, /(pi_[A-Za-z0-9]+)/);
  }
  if (!codes.customerId) {
    codes.customerId = firstMatchFromRegex(paymentUrl, /(cus_[A-Za-z0-9]+)/);
  }
  if (!codes.invoiceId) {
    codes.invoiceId = firstMatchFromRegex(paymentUrl, /(in_[A-Za-z0-9]+)/);
  }
  if (!codes.subscriptionId) {
    codes.subscriptionId = firstMatchFromRegex(paymentUrl, /(sub_[A-Za-z0-9]+)/);
  }
  if (!codes.paymentLinkId) {
    codes.paymentLinkId = firstMatchFromRegex(paymentUrl, /(plink_[A-Za-z0-9]+)/);
  }

  return codes;
}

function mergeStripeCodes(...candidates: Array<StripeCodes | undefined>): StripeCodes | undefined {
  const merged: StripeCodes = {};
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (candidate.checkoutSessionId) {
      merged.checkoutSessionId = candidate.checkoutSessionId;
    }
    if (candidate.paymentIntentId) {
      merged.paymentIntentId = candidate.paymentIntentId;
    }
    if (candidate.customerId) {
      merged.customerId = candidate.customerId;
    }
    if (candidate.invoiceId) {
      merged.invoiceId = candidate.invoiceId;
    }
    if (candidate.subscriptionId) {
      merged.subscriptionId = candidate.subscriptionId;
    }
    if (candidate.paymentLinkId) {
      merged.paymentLinkId = candidate.paymentLinkId;
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function mapStripePaymentStatus(status?: string) {
  switch (status) {
    case 'paid':
    case 'succeeded':
      return 'pago';
    case 'processing':
      return 'em processamento';
    case 'canceled':
    case 'cancelled':
      return 'cancelado';
    case 'requires_action':
      return 'acao necessaria';
    case 'requires_payment_method':
      return 'aguardando metodo de pagamento';
    case 'requires_confirmation':
      return 'aguardando confirmacao';
    case 'requires_capture':
      return 'aguardando captura';
    case 'unpaid':
    case 'open':
      return 'pendente';
    default:
      return 'nao identificado';
  }
}

function mapBookingStatusFromStripe(status?: string) {
  switch (status) {
    case 'paid':
    case 'succeeded':
      return 'confirmado (pagamento identificado)';
    case 'processing':
      return 'aguardando confirmacao financeira';
    case 'canceled':
    case 'cancelled':
      return 'cancelado';
    case 'unpaid':
    case 'open':
    case 'requires_action':
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_capture':
      return 'pendente de pagamento';
    default:
      return 'em analise';
  }
}

async function fetchStripeObject(path: string, secretKey: string) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      return undefined;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function extractStripeCodes(value: unknown, depth = 0): StripeCodes | undefined {
  if (!isRecord(value) || depth > 4) {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const direct: StripeCodes = {
    checkoutSessionId:
      asString(source.checkoutSessionId) ??
      asString(source.checkout_session_id) ??
      asString(source.sessionId) ??
      asString(source.session_id),
    paymentIntentId:
      asString(source.paymentIntentId) ??
      asString(source.payment_intent) ??
      asString(source.paymentIntent) ??
      asString(source.intentId),
    customerId:
      asString(source.customerId) ??
      asString(source.customer_id) ??
      asString(source.customer),
    invoiceId:
      asString(source.invoiceId) ??
      asString(source.invoice_id) ??
      asString(source.invoice),
    subscriptionId:
      asString(source.subscriptionId) ??
      asString(source.subscription_id) ??
      asString(source.subscription),
    paymentLinkId:
      asString(source.paymentLinkId) ??
      asString(source.payment_link_id) ??
      asString(source.paymentLink),
  };

  const urlBased = extractStripeCodesFromUrl(extractUrl(source));
  const nested = mergeStripeCodes(
    extractStripeCodes(source.payment, depth + 1),
    extractStripeCodes(source.checkout, depth + 1),
    extractStripeCodes(source.metadata, depth + 1),
    extractStripeCodes(source.links, depth + 1),
    extractStripeCodes(source.stripe, depth + 1),
    extractStripeCodes(source.data, depth + 1),
  );

  return mergeStripeCodes(direct, urlBased, nested);
}

async function getAvailableEventTypeId(endpoint: string, apiKey: string) {
  if (cachedEventTypeId) {
    return cachedEventTypeId;
  }

  try {
    const url = new URL(`${endpointV2(endpoint)}/event-types?sortCreatedAt=desc`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'cal-api-version': CAL_API_VERSION.eventTypes,
        'Content-Type': 'application/json; charset=utf-8',
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      return undefined;
    }

    const body = (await response.json()) as Record<string, unknown>;
    const firstId = normalizeEventTypes(body)
      .map((candidate) => candidate.id)
      .find(Boolean);
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
  async getEventTypes(input: { location: string; consultationType: string }) {
    const apiKey = serverEnv.CALCOM_API_KEY;
    const endpoint = serverEnv.CALCOM_API_BASE_URL;

    if (!apiKey || !endpoint) {
      return {
        eventTypes: buildMockEventTypes(input),
        selectedEventTypeId: buildMockEventTypes(input)[0]?.id,
      };
    }

    try {
      const url = new URL(`${endpointV2(endpoint)}/event-types?sortCreatedAt=desc`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'cal-api-version': CAL_API_VERSION.eventTypes,
          'Content-Type': 'application/json; charset=utf-8',
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        const fallback = buildMockEventTypes(input);
        return {
          eventTypes: fallback,
          selectedEventTypeId: fallback[0]?.id,
        };
      }

      const body = (await response.json()) as Record<string, unknown>;
      const eventTypes = normalizeEventTypes(body);
      if (eventTypes.length === 0) {
        const fallback = buildMockEventTypes(input);
        return {
          eventTypes: fallback,
          selectedEventTypeId: fallback[0]?.id,
        };
      }
      const selected = pickBestEventType(eventTypes, input);
      if (selected?.id) {
        cachedEventTypeId = selected.id;
      }
      return {
        eventTypes,
        selectedEventTypeId: selected?.id ?? eventTypes.at(0)?.id,
      };
    } catch {
      const fallback = buildMockEventTypes(input);
      return {
        eventTypes: fallback,
        selectedEventTypeId: fallback[0]?.id,
      };
    }
  },

  async getAvailableDates(input: { eventTypeId: string }) {
    const apiKey = serverEnv.CALCOM_API_KEY;
    const endpoint = serverEnv.CALCOM_API_BASE_URL;

    if (!apiKey || !endpoint) {
      return buildMockAvailableDates();
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    try {
      const url = new URL(`${endpointV2(endpoint)}/slots`);
      url.searchParams.set('eventTypeId', input.eventTypeId);
      url.searchParams.set('start', toIsoDate(today));
      url.searchParams.set('end', toIsoDate(endDate));
      url.searchParams.set('format', 'range');
      url.searchParams.set('timeZone', 'America/Fortaleza');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'cal-api-version': CAL_API_VERSION.slots,
          'Content-Type': 'application/json; charset=utf-8',
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        return buildMockAvailableDates();
      }
      const body = (await response.json()) as Record<string, unknown>;
      const dates = parseAvailableDates(body);
      return dates.length > 0 ? dates : buildMockAvailableDates();
    } catch {
      return buildMockAvailableDates();
    }
  },

  async getSlots(input: SlotSearchInput): Promise<SlotOption[]> {
    const apiKey = serverEnv.CALCOM_API_KEY;
    const endpoint = serverEnv.CALCOM_API_BASE_URL;

    if (!apiKey || !endpoint) {
      return buildMockSlots(input);
    }

    try {
      const eventTypeId = input.eventTypeId ?? (await getAvailableEventTypeId(endpoint, apiKey));
      if (!eventTypeId) {
        return buildMockSlots(input);
      }
      const url = new URL(`${endpointV2(endpoint)}/slots`);
      url.searchParams.set('eventTypeId', eventTypeId);
      if (input.dateIso) {
        url.searchParams.set('start', input.dateIso);
        url.searchParams.set('end', input.dateIso);
      } else {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        url.searchParams.set('start', toIsoDate(today));
        url.searchParams.set('end', toIsoDate(endDate));
      }
      url.searchParams.set('format', 'range');
      url.searchParams.set('timeZone', 'America/Fortaleza');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'cal-api-version': CAL_API_VERSION.slots,
          'Content-Type': 'application/json; charset=utf-8',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return buildMockSlots(input);
      }

      const body = (await response.json()) as Record<string, unknown>;
      const slotsFromRange = normalizeCalSlotsByDate(body.data ?? body.slots, input, input.dateIso);
      const slots = slotsFromRange.length > 0 ? slotsFromRange : normalizeCalSlots(body.slots ?? body.data, input);
      return slots.length > 0 ? slots : buildMockSlots(input);
    } catch {
      return buildMockSlots(input);
    }
  },

  async book(input: BookInput): Promise<{
    protocol: string;
    source: 'calcom' | 'mock';
    paymentUrl?: string;
    stripeCodes?: StripeCodes;
  }> {
    const apiKey = serverEnv.CALCOM_API_KEY;
    const endpoint = serverEnv.CALCOM_API_BASE_URL;

    if (!apiKey || !endpoint) {
      return {
        protocol: `LUMI-MOCK-${Math.floor(Date.now() / 1000)}`,
        source: 'mock',
      };
    }

    try {
      const eventTypeId = input.eventTypeId ?? (await getAvailableEventTypeId(endpoint, apiKey));
      if (!eventTypeId) {
        return {
          protocol: `LUMI-MOCK-${Math.floor(Date.now() / 1000)}`,
          source: 'mock',
        };
      }
      const url = new URL(`${endpointV2(endpoint)}/bookings`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'cal-api-version': CAL_API_VERSION.bookings,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          start: input.slotId,
          eventTypeId: Number(eventTypeId),
          attendee: {
            name: input.fullName,
            email: input.email ?? 'sem-email@local.invalid',
            language: 'pt-BR',
            timeZone: 'America/Fortaleza',
            phoneNumber: input.phone,
          },
          bookingFieldsResponses: {
            location: input.location,
            consultationType: input.consultationType,
          },
        }),
      });

      if (!response.ok) {
        return {
          protocol: `LUMI-MOCK-${Math.floor(Date.now() / 1000)}`,
          source: 'mock',
        };
      }

      const body = (await response.json()) as Record<string, unknown>;
      const payload = (body.data && typeof body.data === 'object' ? body.data : body) as Record<string, unknown>;
      const protocol =
        typeof payload.uid === 'string'
          ? payload.uid
          : typeof payload.id === 'string'
            ? payload.id
            : typeof payload.reference === 'string'
              ? payload.reference
              : `LUMI-CAL-${Math.floor(Date.now() / 1000)}`;

      const paymentUrl = extractUrl(payload) ?? extractUrl(body);
      return {
        protocol,
        source: 'calcom',
        paymentUrl,
        stripeCodes: mergeStripeCodes(
          extractStripeCodes(payload),
          extractStripeCodes(body),
          extractStripeCodesFromUrl(paymentUrl),
        ),
      };
    } catch {
      return {
        protocol: `LUMI-MOCK-${Math.floor(Date.now() / 1000)}`,
        source: 'mock',
      };
    }
  },

  async getBookingStatus(input: {
    protocol?: string;
    paymentUrl?: string;
    stripeCodes?: StripeCodes;
  }): Promise<BookingStatusResult> {
    const mergedCodes = mergeStripeCodes(input.stripeCodes, extractStripeCodesFromUrl(input.paymentUrl));
    const stripeSecretKey = serverEnv.STRIPE_PRIVATE_KEY;

    if (!stripeSecretKey || !mergedCodes) {
      return {
        paymentStatusText: 'nao foi possivel consultar automaticamente',
        bookingStatusText: 'pendente de confirmacao manual',
        paymentUrl: input.paymentUrl,
        source: 'cache',
      };
    }

    let stripeStatus: string | undefined;

    if (mergedCodes.checkoutSessionId) {
      const checkout = await fetchStripeObject(`checkout/sessions/${mergedCodes.checkoutSessionId}`, stripeSecretKey);
      stripeStatus = asString(checkout?.payment_status) ?? asString(checkout?.status);

      if (!mergedCodes.paymentIntentId) {
        const paymentIntentFromSession = checkout?.payment_intent;
        if (typeof paymentIntentFromSession === 'string') {
          mergedCodes.paymentIntentId = paymentIntentFromSession;
        }
      }
    }

    if (!stripeStatus && mergedCodes.paymentIntentId) {
      const paymentIntent = await fetchStripeObject(`payment_intents/${mergedCodes.paymentIntentId}`, stripeSecretKey);
      stripeStatus = asString(paymentIntent?.status);
    }

    return {
      paymentStatusText: mapStripePaymentStatus(stripeStatus),
      bookingStatusText: mapBookingStatusFromStripe(stripeStatus),
      paymentUrl: input.paymentUrl,
      source: stripeStatus ? 'stripe' : 'cache',
    };
  },
};
