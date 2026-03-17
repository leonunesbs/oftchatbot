import { api } from "@convex/_generated/api";

import { getConvexHttpClient } from "@/lib/convex-server";

export type PaymentMode = "booking_fee" | "full_payment" | "in_person";

export type BookingEventTypeOption = {
  value: string;
  label: string;
  address?: string;
  eventTypesCount?: number;
  consultationPriceCents?: number;
  reservationFeeCents?: number;
  reservationFeePercent?: number;
  paymentMode?: PaymentMode;
};

export type EventTypeAvailabilityDate = {
  isoDate: string;
  label: string;
  weekdayLabel: string;
  times: string[];
};

export type EventTypeAvailabilityResponse = {
  eventType: string;
  dates: EventTypeAvailabilityDate[];
};

export type BookingBootstrapData = {
  eventTypes: BookingEventTypeOption[];
  eventTypesError: string | null;
  availabilityByEventType: Record<string, EventTypeAvailabilityResponse>;
  availabilityErrorsByEventType: Record<string, string>;
};

export async function getBookingBootstrapData(options?: {
  daysAhead?: number;
}): Promise<BookingBootstrapData> {
  const client = getConvexHttpClient();
  const daysAhead =
    typeof options?.daysAhead === "number" && Number.isFinite(options.daysAhead)
      ? Math.max(1, Math.floor(options.daysAhead))
      : 3650;
  let eventTypes: BookingEventTypeOption[] = [];
  let eventTypesError: string | null = null;

  try {
    const response = await client.query(api.appointments.getActiveBookingEventTypes, {});
    eventTypes = Array.isArray(response) ? (response as BookingEventTypeOption[]) : [];
  } catch (error) {
    eventTypesError =
      error instanceof Error ? error.message : "Falha ao carregar eventos disponíveis.";
  }

  const availabilityByEventType: Record<string, EventTypeAvailabilityResponse> = {};
  const availabilityErrorsByEventType: Record<string, string> = {};

  await Promise.all(
    eventTypes.map(async (eventTypeOption) => {
      try {
        const options = await client.query(api.appointments.getBookingOptionsByEventType, {
          eventType: eventTypeOption.value,
          daysAhead,
        });
        const resolvedOptions =
          (options as EventTypeAvailabilityResponse) ?? {
            eventType: eventTypeOption.value,
            dates: [],
          };
        availabilityByEventType[eventTypeOption.value] = {
          eventType: resolvedOptions.eventType,
          dates: resolvedOptions.dates.map((dateOption) => ({
            ...dateOption,
            // Times are fetched client-side after the user picks a date.
            times: [],
          })),
        };
      } catch (error) {
        availabilityErrorsByEventType[eventTypeOption.value] =
          error instanceof Error ? error.message : "Falha ao carregar disponibilidade.";
      }
    }),
  );

  return {
    eventTypes,
    eventTypesError,
    availabilityByEventType,
    availabilityErrorsByEventType,
  };
}
