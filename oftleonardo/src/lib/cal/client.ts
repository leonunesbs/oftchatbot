import type {
  CalApiListResponse,
  CalBookingData,
  CalCreateBookingInput,
  CalEventType,
  CalSlotsByDate,
} from "@/lib/cal/types";

const CAL_API_BASE_URL = import.meta.env.CAL_API_BASE_URL ?? "https://api.cal.com";
const CAL_API_KEY = import.meta.env.CAL_API_KEY;
// Keep this below serverless execution limits so API routes can recover with fallback.
const REQUEST_TIMEOUT_MS = 7_000;

const CAL_API_VERSION = {
  eventTypes: "2024-06-14",
  slots: "2024-09-04",
  bookings: "2024-08-13",
} as const;

type CalApiVersion = (typeof CAL_API_VERSION)[keyof typeof CAL_API_VERSION];

export class CalApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "CalApiError";
    this.status = status;
    this.details = details;
  }
}

function getApiKey() {
  if (!CAL_API_KEY) {
    throw new CalApiError("CAL_API_KEY is not configured", 500);
  }
  return CAL_API_KEY;
}

async function requestCal<T>(path: string, init: RequestInit, version: CalApiVersion) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${CAL_API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "cal-api-version": version,
        "content-type": "application/json; charset=utf-8",
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    let parsed: unknown = null;

    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      throw new CalApiError("Cal.com API request failed", response.status, parsed);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof CalApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new CalApiError("Cal.com API request timed out", 504);
    }
    throw new CalApiError("Unexpected error while calling Cal.com API", 500);
  } finally {
    clearTimeout(timeout);
  }
}

export async function listEventTypes() {
  const response = await requestCal<CalApiListResponse<CalEventType[]>>(
    "/v2/event-types?sortCreatedAt=desc",
    { method: "GET" },
    CAL_API_VERSION.eventTypes
  );

  return response.data ?? [];
}

interface GetSlotsInput {
  eventTypeId: number;
  start: string;
  end: string;
  timeZone?: string;
}

export async function getSlotsByEventTypeId({
  eventTypeId,
  start,
  end,
  timeZone = "America/Fortaleza",
}: GetSlotsInput) {
  const params = new URLSearchParams({
    eventTypeId: String(eventTypeId),
    start,
    end,
    format: "range",
    timeZone,
  });

  const response = await requestCal<CalApiListResponse<CalSlotsByDate>>(
    `/v2/slots?${params.toString()}`,
    { method: "GET" },
    CAL_API_VERSION.slots
  );

  return response.data ?? {};
}

export async function createBooking(input: CalCreateBookingInput) {
  const response = await requestCal<CalApiListResponse<CalBookingData>>(
    "/v2/bookings",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    CAL_API_VERSION.bookings
  );

  return response.data;
}
