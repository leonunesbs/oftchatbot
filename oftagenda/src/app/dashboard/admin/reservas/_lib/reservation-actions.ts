import { getAdminSnapshot } from "@/app/dashboard/admin/_lib/admin-dashboard";
import { clerkClient } from "@clerk/nextjs/server";

type PatientProfileValues = {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
};

type RescheduleDateOption = {
  isoDate: string;
  label: string;
  weekdayLabel: string;
  times: string[];
};

const RESCHEDULE_DATE_LOOKAHEAD_DAYS = 180;

function getEventTypeLabel(
  eventType: "created" | "confirmed" | "rescheduled" | "no_show" | "cancelled" | "completed" | "details_submitted",
) {
  switch (eventType) {
    case "created":
      return "Cadastro";
    case "confirmed":
      return "Confirmação";
    case "rescheduled":
      return "Reagendamento";
    case "no_show":
      return "Não compareceu";
    case "cancelled":
      return "Cancelamento";
    case "completed":
      return "Concluído";
    case "details_submitted":
      return "Detalhes enviados";
    default:
      return "Atualização";
  }
}

function normalizeText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeBirthDate(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : undefined;
}

function parseTimeToMinutes(time: string) {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw ?? "0");
  const minutes = Number(minutesRaw ?? "0");
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildSlotsWithinRange(startTime: string, endTime: string, durationMinutes: number) {
  const safeDuration = durationMinutes > 0 ? durationMinutes : 30;
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  const slots: string[] = [];

  for (let cursor = start; cursor + safeDuration <= end; cursor += safeDuration) {
    slots.push(formatMinutesToTime(cursor));
  }

  return slots;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDateToLocalDate(isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }
  const [yearRaw, monthRaw, dayRaw] = isoDate.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  return new Date(year, month - 1, day, 12, 0, 0);
}

function resolveAvailabilityGroupName(availability: { _id: string; name?: string } | undefined) {
  if (!availability) {
    return "Disponibilidade";
  }
  const normalized = availability.name?.trim();
  if (normalized && normalized.length > 0) {
    return normalized;
  }
  return `Disponibilidade-${availability._id}`;
}

function buildRescheduleDateOptions(args: {
  eventTypeId: string;
  snapshot: Awaited<ReturnType<typeof getAdminSnapshot>>;
  now?: number;
  daysAhead?: number;
}): RescheduleDateOption[] {
  const { eventTypeId, snapshot } = args;
  const now = args.now ?? Date.now();
  const daysAhead = args.daysAhead ?? RESCHEDULE_DATE_LOOKAHEAD_DAYS;

  const eventType = snapshot.eventTypes.find((item) => String(item._id) === eventTypeId);
  if (!eventType?.availabilityId) {
    return [];
  }

  const baseAvailability = snapshot.availabilities.find(
    (item) => String(item._id) === String(eventType.availabilityId),
  );
  const groupName = resolveAvailabilityGroupName(
    baseAvailability
      ? {
          _id: String(baseAvailability._id),
          name: baseAvailability.name,
        }
      : undefined,
  );

  const activeGroupSlots = snapshot.availabilities.filter(
    (item) => item.status === "active" && resolveAvailabilityGroupName({ _id: String(item._id), name: item.name }) === groupName,
  );
  if (activeGroupSlots.length === 0) {
    return [];
  }

  const overrideByDate = new Map(
    snapshot.availabilityOverrides
      .filter((override) => override.groupName === groupName)
      .map((override) => [override.date, override]),
  );

  const duration = eventType.durationMinutes > 0 ? eventType.durationMinutes : 30;
  const options: RescheduleDateOption[] = [];

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const isoDate = toIsoDate(date);
    const parsedDate = parseIsoDateToLocalDate(isoDate);
    if (!parsedDate) {
      continue;
    }

    const override = overrideByDate.get(isoDate);
    const daySlots = new Set<string>();
    if (override) {
      if (override.allDayUnavailable) {
        continue;
      }
      const activeOverrideSlots = override.slots.filter((slot) => slot.status === "active");
      for (const slot of activeOverrideSlots) {
        for (const generatedSlot of buildSlotsWithinRange(slot.startTime, slot.endTime, duration)) {
          daySlots.add(generatedSlot);
        }
      }
    } else {
      const weekday = parsedDate.getDay();
      const weeklySlots = activeGroupSlots.filter((availability) => availability.weekday === weekday);
      for (const weeklySlot of weeklySlots) {
        for (const generatedSlot of buildSlotsWithinRange(weeklySlot.startTime, weeklySlot.endTime, duration)) {
          daySlots.add(generatedSlot);
        }
      }
    }

    const times = [...daySlots].sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
    if (times.length === 0) {
      continue;
    }

    options.push({
      isoDate,
      label: parsedDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      weekdayLabel: parsedDate.toLocaleDateString("pt-BR", { weekday: "short" }),
      times,
    });
  }

  return options;
}

function resolveMergedPatientField({
  clerkValue,
  databaseValue,
  normalize,
}: {
  clerkValue?: string;
  databaseValue?: string;
  normalize: (value: string | undefined) => string | undefined;
}) {
  const normalizedClerk = normalize(clerkValue);
  const normalizedDatabase = normalize(databaseValue);

  if (normalizedClerk && normalizedDatabase) {
    if (normalizedClerk === normalizedDatabase) {
      return { value: normalizedClerk, source: "clerk+database" as const };
    }
    return { value: normalizedClerk, source: "clerk" as const };
  }
  if (normalizedClerk) {
    return { value: normalizedClerk, source: "clerk" as const };
  }
  if (normalizedDatabase) {
    return { value: normalizedDatabase, source: "database" as const };
  }
  return { value: undefined, source: "not_found" as const };
}

function getPrimaryEmailFromClerkUser(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>) {
  const primaryEmailId = user.primaryEmailAddressId;
  if (primaryEmailId) {
    const primary = user.emailAddresses.find((item) => item.id === primaryEmailId);
    if (primary?.emailAddress) {
      return primary.emailAddress;
    }
  }
  return user.emailAddresses[0]?.emailAddress;
}

function getPrimaryPhoneFromClerkUser(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>) {
  const primaryPhoneId = user.primaryPhoneNumberId;
  if (primaryPhoneId) {
    const primary = user.phoneNumbers.find((item) => item.id === primaryPhoneId);
    if (primary?.phoneNumber) {
      return primary.phoneNumber;
    }
  }
  return user.phoneNumbers[0]?.phoneNumber;
}

function getBirthDateFromClerkUser(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>) {
  const metadataCandidates = [user.unsafeMetadata, user.publicMetadata, user.privateMetadata];
  for (const metadata of metadataCandidates) {
    if (!metadata || typeof metadata !== "object") {
      continue;
    }
    const values = metadata as Record<string, unknown>;
    const candidates = [values.birthDate, values.birthdate, values.dateOfBirth];
    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const normalized = normalizeBirthDate(candidate);
        if (normalized) {
          return normalized;
        }
      }
    }
  }
  return undefined;
}

async function getPatientFromClerk(clerkUserId: string): Promise<PatientProfileValues> {
  if (!clerkUserId.startsWith("user_")) {
    return {};
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(clerkUserId);
    return {
      name: normalizeText(user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(" ")),
      email: normalizeText(getPrimaryEmailFromClerkUser(user)),
      phone: normalizeText(getPrimaryPhoneFromClerkUser(user)),
      birthDate: getBirthDateFromClerkUser(user),
    };
  } catch {
    return {};
  }
}

export async function getReservationActionData(reservationId: string) {
  const data = await getAdminSnapshot();
  const usersByClerkId = new Map(data.users.map((user) => [user.clerkUserId, user]));
  const eventTypeById = new Map(data.eventTypes.map((eventType) => [String(eventType._id), eventType]));
  const reservation = data.reservations.find((item) => String(item._id) === reservationId);

  if (!reservation) {
    return null;
  }

  const user = usersByClerkId.get(reservation.clerkUserId);
  const clerkPatient = await getPatientFromClerk(reservation.clerkUserId);
  const databasePatient: PatientProfileValues = {
    name: user?.name,
    email: user?.email,
    phone: normalizeText(user?.whatsapp) ?? user?.phone,
    birthDate: user?.birthDate,
  };

  const mergedName = resolveMergedPatientField({
    clerkValue: clerkPatient.name,
    databaseValue: databasePatient.name,
    normalize: normalizeText,
  });
  const mergedEmail = resolveMergedPatientField({
    clerkValue: clerkPatient.email,
    databaseValue: databasePatient.email,
    normalize: normalizeText,
  });
  const mergedPhone = resolveMergedPatientField({
    clerkValue: databasePatient.phone ? undefined : clerkPatient.phone,
    databaseValue: databasePatient.phone,
    normalize: normalizeText,
  });
  const mergedBirthDate = resolveMergedPatientField({
    clerkValue: clerkPatient.birthDate,
    databaseValue: databasePatient.birthDate,
    normalize: normalizeBirthDate,
  });

  const eventType = eventTypeById.get(String(reservation.eventTypeId));
  const rescheduleDateOptions = buildRescheduleDateOptions({
    eventTypeId: String(reservation.eventTypeId),
    snapshot: data,
  });
  const recentTimeline =
    typeof reservation.appointmentId === "string"
      ? data.appointmentEvents
          .filter((event) => String(event.appointmentId) === reservation.appointmentId)
          .slice(0, 8)
          .map((event) => ({
            id: String(event._id),
            eventType: event.eventType,
            label: getEventTypeLabel(event.eventType),
            notes: event.notes ?? "",
            createdAt: event.createdAt,
          }))
      : [];

  return {
    _id: String(reservation._id),
    clerkUserId: reservation.clerkUserId,
    appointmentId: reservation.appointmentId ? String(reservation.appointmentId) : null,
    eventTypeId: String(reservation.eventTypeId),
    availabilityId: String(reservation.availabilityId),
    eventTypeTitle: reservation.eventTypeTitle,
    eventKind: eventType?.kind ?? "consulta",
    location: eventType?.location ?? "fortaleza",
    availabilityLabel: reservation.availabilityLabel,
    status: reservation.status,
    startsAt: reservation.startsAt,
    updatedAt: reservation.updatedAt,
    notes: reservation.notes,
    patientName: mergedName.value,
    patientEmail: mergedEmail.value,
    patientPhone: mergedPhone.value,
    patientBirthDate: mergedBirthDate.value,
    rescheduleDateOptions,
    recentTimeline,
  };
}
