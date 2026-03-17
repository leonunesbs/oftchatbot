import { api } from "@convex/_generated/api";

import { getBookingBootstrapData, type BookingLocationOption } from "@/lib/booking-bootstrap";
import { getAuthenticatedConvexHttpClient } from "@/lib/convex-server";

type ReschedulePolicy = {
  canReschedule: boolean;
  canCancel: boolean;
  isClinicInitiatedReschedule: boolean;
  cancelReason: string | null;
  requiresHumanSupport: boolean;
  reason: string | null;
  maxReschedules: number;
  reschedulesUsed: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  requiresPaidReschedule: boolean;
  paidRescheduleAmountCents: number | null;
};

export type PatientRescheduleData = {
  policy: ReschedulePolicy;
  fixedEventType: {
    id: string;
    label: string;
  };
  fixedLocation: BookingLocationOption;
  availabilityError?: string;
  dateOptions: Array<{
    isoDate: string;
    label: string;
    weekdayLabel: string;
    times: string[];
  }>;
};

const DEFAULT_POLICY: ReschedulePolicy = {
  canReschedule: false,
  canCancel: false,
  isClinicInitiatedReschedule: false,
  cancelReason: "Nenhuma consulta ativa encontrada.",
  requiresHumanSupport: false,
  reason: "Nenhuma consulta ativa encontrada.",
  maxReschedules: 1,
  reschedulesUsed: 0,
  minNoticeHours: 24,
  maxDaysAhead: 30,
  requiresPaidReschedule: false,
  paidRescheduleAmountCents: null,
};

export async function getPatientRescheduleData(): Promise<PatientRescheduleData | null> {
  try {
    const { client } = await getAuthenticatedConvexHttpClient();
    const dashboardData = await client.query(api.appointments.getDashboardState, {});
    if (!dashboardData.hasConfirmedBooking || !dashboardData.nextAppointment) {
      return null;
    }

    const bootstrap = await getBookingBootstrapData({ daysAhead: 30 });
    const bookingSlug = dashboardData.nextAppointment.eventSlug;
    if (!bookingSlug) {
      return null;
    }
    const fixedEventTypeId = dashboardData.nextAppointment.eventTypeId;
    if (!fixedEventTypeId) {
      return null;
    }
    const fixedLocation = bootstrap.locations.find((item) => item.value === bookingSlug);
    if (!fixedLocation) {
      return null;
    }
    const fixedEventTypeLabel =
      dashboardData.nextAppointment.eventName ??
      dashboardData.nextAppointment.consultationType ??
      "Atendimento";

    const availability = bootstrap.availabilityByLocation[fixedLocation.value];
    return {
      policy: dashboardData.reschedulePolicy ?? DEFAULT_POLICY,
      fixedEventType: {
        id: String(fixedEventTypeId),
        label: fixedEventTypeLabel,
      },
      fixedLocation,
      availabilityError: bootstrap.availabilityErrorsByLocation[fixedLocation.value],
      dateOptions: availability?.dates ?? [],
    };
  } catch {
    return null;
  }
}
