import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const RESERVATION_HOLD_DURATION_MS = 15 * 60_000;
const RESCHEDULE_CHECKOUT_HOLD_DURATION_MS = 30 * 60_000;
const RESCHEDULE_MIN_NOTICE_MS = 24 * 60 * 60_000;
const BOOKING_MIN_NOTICE_MS = 48 * 60 * 60_000;
const RESCHEDULE_MAX_DAYS_AHEAD = 30;
const RESCHEDULE_MAX_PER_APPOINTMENT = 1;
const RESERVATION_FEE_PERCENT = 20;

const bookingEventTypeValidator = v.string();

const periodValidator = v.union(
  v.literal("manha"),
  v.literal("tarde"),
  v.literal("noite"),
  v.literal("qualquer"),
);

export const confirmBooking = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    eventType: bookingEventTypeValidator,
    preferredPeriod: periodValidator,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const clerkUserId = identity.subject;
    await assertCanCreateNewBooking(ctx, clerkUserId, now);
    const patient = await findOrCreatePatient(ctx, clerkUserId, args.name, args.phone, args.email, now);

    const activeEventTypes = await ctx.db
      .query("event_types")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const selectedEventType = activeEventTypes.find((item) => item.slug === args.eventType);
    if (!selectedEventType) {
      throw new Error("Local selecionado nao encontrado");
    }

    const appointmentId = await ctx.db.insert("appointments", {
      clerkUserId,
      patientId: patient._id,
      name: args.name,
      phone: args.phone,
      email: args.email,
      eventTypeId: selectedEventType._id,
      preferredPeriod: args.preferredPeriod,
      reason: args.reason,
      status: "confirmed",
      requestedAt: now,
      updatedAt: now,
      consultationType:
        selectedEventType.name ??
        selectedEventType.title ??
        selectedEventType.slug,
    });

    await ctx.db.insert("appointment_events", {
      appointmentId,
      clerkUserId,
      eventType: "confirmed",
      notes: "Solicitacao confirmada via fluxo sem atrito.",
      createdAt: now,
    });

    return { appointmentId, status: "confirmed" as const };
  },
});

export const hasConfirmedBooking = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return false;
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    const now = Date.now();
    return appointments.some((item) => isAppointmentCurrentlyActive(item, now));
  },
});

export const getBookingOptionsByEventType = query({
  args: {
    eventType: bookingEventTypeValidator,
    daysAhead: v.optional(v.number()),
    targetDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const daysAhead = clampDaysAhead(args.daysAhead ?? 3650);
    const activeEventTypes = await ctx.db
      .query("event_types")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const eventTypes = activeEventTypes.filter(
      (item) =>
        item.slug === args.eventType &&
        Boolean(item.availabilityId),
    );
    if (eventTypes.length === 0) {
      return { eventType: args.eventType, dates: [] };
    }

    const [allAvailabilities, allOverrides] = await Promise.all([
      ctx.db.query("availabilities").collect(),
      ctx.db.query("availability_overrides").collect(),
    ]);
    const availabilityById = new Map(allAvailabilities.map((item) => [String(item._id), item]));
    const durationByEventType = new Map(eventTypes.map((item) => [item._id, item.durationMinutes]));
    const availabilityGroupsByEventType = new Map(
      eventTypes.map((eventType) => [
        String(eventType._id),
        eventType.availabilityId
          ? resolveAvailabilityGroupName(availabilityById.get(String(eventType.availabilityId)))
          : null,
      ]),
    );
    const activeGroupNames = new Set(
      [...availabilityGroupsByEventType.values()].filter(
        (groupName): groupName is string => typeof groupName === "string" && groupName.length > 0,
      ),
    );
    if (activeGroupNames.size === 0) {
      return { eventType: args.eventType, dates: [] };
    }

    const eventTypeByGroupName = new Map<string, (typeof eventTypes)[number]>();
    for (const eventType of eventTypes) {
      const groupName = availabilityGroupsByEventType.get(String(eventType._id));
      if (groupName && !eventTypeByGroupName.has(groupName)) {
        eventTypeByGroupName.set(groupName, eventType);
      }
    }

    const availabilities = allAvailabilities.filter(
      (item) => item.status === "active" && activeGroupNames.has(resolveAvailabilityGroupName(item)),
    );

    const availabilityByGroup = new Map<string, typeof availabilities>();
    for (const availability of availabilities) {
      const groupName = resolveAvailabilityGroupName(availability);
      const current = availabilityByGroup.get(groupName) ?? [];
      current.push(availability);
      availabilityByGroup.set(groupName, current);
    }

    const relevantOverrides = allOverrides.filter((override) =>
      activeGroupNames.has(override.groupName.trim()),
    );
    if (availabilities.length === 0 && relevantOverrides.length === 0) {
      return { eventType: args.eventType, dates: [] };
    }
    const overrideByGroupDate = new Map(
      relevantOverrides.map((override) => [buildOverrideKey(override.groupName.trim(), override.date), override]),
    );

    const allReservations = await ctx.db.query("reservations").collect();
    const now = Date.now();
    const reservations = allReservations.filter((item) => {
      if (!eventTypes.some((eventType) => eventType._id === item.eventTypeId)) {
        return false;
      }
      return isReservationBlocking(item, now);
    });

    const reservedSlots = new Set<string>();
    for (const reservation of reservations) {
      const availability = availabilityById.get(String(reservation.availabilityId));
      if (!availability) {
        continue;
      }
      const groupName = resolveAvailabilityGroupName(availability);
      const dateKey = formatDateInTimezone(reservation.startsAt, availability.timezone);
      const timeKey = formatTimeInTimezone(reservation.startsAt, availability.timezone);
      reservedSlots.add(buildSlotKey(groupName, dateKey, timeKey));
    }

    const dates: Array<{
      isoDate: string;
      label: string;
      weekdayLabel: string;
      times: string[];
    }> = [];

    const targetDate = normalizeTargetDate(args.targetDate);
    const candidateDates = targetDate
      ? [targetDate]
      : Array.from({ length: daysAhead }, (_, offset) => {
          const day = new Date(now);
          day.setDate(day.getDate() + offset);
          return toIsoDate(day);
        });

    for (const isoDate of candidateDates) {
      const parsedDate = parseIsoDateToLocalDate(isoDate);
      if (!parsedDate) {
        continue;
      }
      const weekday = parsedDate.getDay();
      const daySlots = new Set<string>();

      for (const groupName of activeGroupNames) {
        const assignedEventType = eventTypeByGroupName.get(groupName);
        const duration = assignedEventType ? durationByEventType.get(assignedEventType._id) ?? 30 : 30;
        const requiresMinBookingNotice = !isUrgencyEventType(assignedEventType);

        const override = overrideByGroupDate.get(buildOverrideKey(groupName, isoDate));
        if (override) {
          if (override.allDayUnavailable) {
            continue;
          }
          const activeOverrideSlots = override.slots.filter((slot) => slot.status === "active");
          for (const overrideSlot of activeOverrideSlots) {
            const generatedSlots = buildSlotsWithinRange(
              overrideSlot.startTime,
              overrideSlot.endTime,
              duration,
            );
            for (const slot of generatedSlots) {
              if (!isIsoDateTimeInFutureForTimezone(isoDate, slot, override.timezone, now)) {
                continue;
              }
              if (
                requiresMinBookingNotice &&
                !isIsoDateTimeAtLeastMinNotice(
                  isoDate,
                  slot,
                  override.timezone,
                  now,
                  BOOKING_MIN_NOTICE_MS,
                )
              ) {
                continue;
              }
              const key = buildSlotKey(groupName, isoDate, slot);
              if (reservedSlots.has(key)) {
                continue;
              }
              daySlots.add(slot);
            }
          }
          continue;
        }

        const weeklySlots = (availabilityByGroup.get(groupName) ?? []).filter(
          (availability) => availability.weekday === weekday,
        );
        for (const availability of weeklySlots) {
          const slots = buildSlotsWithinRange(availability.startTime, availability.endTime, duration);
          for (const slot of slots) {
            if (!isIsoDateTimeInFutureForTimezone(isoDate, slot, availability.timezone, now)) {
              continue;
            }
            if (
              requiresMinBookingNotice &&
              !isIsoDateTimeAtLeastMinNotice(
                isoDate,
                slot,
                availability.timezone,
                now,
                BOOKING_MIN_NOTICE_MS,
              )
            ) {
              continue;
            }
            const key = buildSlotKey(groupName, isoDate, slot);
            if (reservedSlots.has(key)) {
              continue;
            }
            daySlots.add(slot);
          }
        }
      }

      const times = [...daySlots].sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
      if (times.length === 0) {
        continue;
      }

      dates.push({
        isoDate,
        label: parsedDate.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        weekdayLabel: parsedDate.toLocaleDateString("pt-BR", { weekday: "short" }),
        times,
      });
    }

    return { eventType: args.eventType, dates };
  },
});

export const getActiveBookingEventTypes = query({
  args: {},
  handler: async (ctx) => {
    const [eventTypes, allAvailabilities, allOverrides] = await Promise.all([
      ctx.db
        .query("event_types")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect(),
      ctx.db.query("availabilities").collect(),
      ctx.db.query("availability_overrides").collect(),
    ]);
    const availabilityById = new Map(allAvailabilities.map((item) => [String(item._id), item]));
    return [...eventTypes]
      .filter(
        (eventType) =>
          hasBookableAvailabilityForEventType(eventType, availabilityById, allAvailabilities, allOverrides),
      )
      .sort((a, b) => {
        const labelA = a.name ?? a.title;
        const labelB = b.name ?? b.title;
        return labelA.localeCompare(labelB, "pt-BR");
      })
      .map((eventType) => {
        const paymentMode = eventType.paymentMode ?? "booking_fee";
        const priceCents = normalizeAmountCents(eventType.priceCents) ?? 0;
        const feePercent = paymentMode === "full_payment" ? 100
          : paymentMode === "in_person" ? 0
          : RESERVATION_FEE_PERCENT;
        return {
          consultationPriceCents: priceCents,
          reservationFeeCents: paymentMode === "in_person"
            ? 0
            : paymentMode === "full_payment"
              ? priceCents
              : calculateReservationFeeCents(priceCents, RESERVATION_FEE_PERCENT),
          reservationFeePercent: feePercent,
          paymentMode,
          value: eventType.slug,
          label: eventType.name ?? eventType.title,
          address: eventType.address ?? "",
        };
      });
  },
});

function hasBookableAvailabilityForEventType(
  eventType: Pick<Doc<"event_types">, "availabilityId">,
  availabilityById: Map<string, Doc<"availabilities">>,
  allAvailabilities: Doc<"availabilities">[],
  allOverrides: Doc<"availability_overrides">[],
) {
  if (!eventType.availabilityId) {
    return false;
  }
  const referenceAvailability = availabilityById.get(String(eventType.availabilityId));
  if (!referenceAvailability) {
    return false;
  }
  const groupName = resolveAvailabilityGroupName(referenceAvailability);
  const hasWeeklyAvailability = allAvailabilities.some(
    (availability) =>
      availability.status === "active" && resolveAvailabilityGroupName(availability) === groupName,
  );
  if (hasWeeklyAvailability) {
    return true;
  }
  return allOverrides.some(
    (override) =>
      override.groupName === groupName &&
      !override.allDayUnavailable &&
      override.slots.some((slot) => slot.status === "active"),
  );
}

export const getDashboardState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const [appointments, reservations, eventTypes, availabilities] = await Promise.all([
      ctx.db
        .query("appointments")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
        .collect(),
      ctx.db
        .query("reservations")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
        .collect(),
      ctx.db.query("event_types").collect(),
      ctx.db.query("availabilities").collect(),
    ]);

    const sorted = [...appointments].sort((a, b) => b.requestedAt - a.requestedAt);
    const now = Date.now();
    const nextAppointment = sorted.find((item) => isAppointmentCurrentlyActive(item, now)) ?? null;
    const eventTypeById = new Map(eventTypes.map((item) => [String(item._id), item]));
    const availabilityById = new Map(availabilities.map((item) => [String(item._id), item]));
    const pendingReservations = [...reservations]
      .filter((item) => item.status === "pending" && getReservationHoldExpiresAt(item) > now)
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, 8)
      .map((item) => {
        const eventType = eventTypeById.get(String(item.eventTypeId));
        const availability =
          availabilityById.get(String(item.availabilityId)) ??
          (eventType?.availabilityId
            ? availabilityById.get(String(eventType.availabilityId))
            : undefined);
        const timezone = availability?.timezone ?? "America/Fortaleza";
        return {
          _id: item._id,
          startsAt: item.startsAt,
          holdExpiresAt: getReservationHoldExpiresAt(item),
          consultationType: eventType?.name ?? eventType?.title ?? "",
          checkoutEventType: eventType?.slug ?? "",
          checkoutDate: formatDateInTimezone(item.startsAt, timezone),
          checkoutTime: formatTimeInTimezone(item.startsAt, timezone),
        };
      });

    const resolvedNextAppointment = nextAppointment
      ? {
          ...nextAppointment,
          eventSlug: nextAppointment.eventTypeId
            ? (eventTypeById.get(String(nextAppointment.eventTypeId))?.slug ?? null)
            : null,
          eventName: nextAppointment.eventTypeId
            ? (eventTypeById.get(String(nextAppointment.eventTypeId))?.name ??
              eventTypeById.get(String(nextAppointment.eventTypeId))?.title ??
              null)
            : null,
          eventAddress: nextAppointment.eventTypeId
            ? (eventTypeById.get(String(nextAppointment.eventTypeId))?.address ?? null)
            : null,
          paymentMode: nextAppointment.eventTypeId
            ? (eventTypeById.get(String(nextAppointment.eventTypeId))?.paymentMode ?? null)
            : null,
        }
      : null;

    const reschedulePolicy = nextAppointment
      ? await buildReschedulePolicy(ctx, nextAppointment, now)
      : {
          canReschedule: false,
          canCancel: false,
          isClinicInitiatedReschedule: false,
          cancelReason: "Nenhuma consulta ativa encontrada.",
          requiresHumanSupport: false,
          reason: "Nenhuma consulta ativa encontrada.",
          maxReschedules: RESCHEDULE_MAX_PER_APPOINTMENT,
          reschedulesUsed: 0,
          minNoticeHours: 24,
          maxDaysAhead: RESCHEDULE_MAX_DAYS_AHEAD,
          requiresPaidReschedule: false,
          paidRescheduleAmountCents: null,
        };

    return {
      hasConfirmedBooking: nextAppointment !== null,
      nextAppointment: resolvedNextAppointment,
      reschedulePolicy,
      pendingReservations,
      history: sorted.slice(0, 8).map((item) => ({
        ...item,
        status: deriveAppointmentStatus(item, now),
      })),
    };
  },
});

export const rescheduleOwnAppointment = mutation({
  args: {
    eventTypeId: v.id("event_types"),
    eventType: bookingEventTypeValidator,
    date: v.string(),
    time: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .collect();
    await markOverdueAppointmentsAsNoShow(ctx, appointments, now);
    const sorted = [...appointments].sort((a, b) => b.requestedAt - a.requestedAt);
    const appointment = sorted.find((item) => isAppointmentCurrentlyActive(item, now)) ?? null;
    if (!appointment) {
      throw new Error("Nenhuma consulta ativa encontrada para remarcação.");
    }

    const policy = await buildReschedulePolicy(ctx, appointment, now);
    if (!policy.canReschedule) {
      throw new Error(policy.reason ?? "Consulta indisponível para remarcação.");
    }
    const isClinicInitiatedReschedule = policy.isClinicInitiatedReschedule === true;
    const scheduledFor = appointment.scheduledFor;
    if (typeof scheduledFor !== "number" && !isClinicInitiatedReschedule) {
      throw new Error("Consulta ainda sem horário definido.");
    }

    if (String(appointment.eventTypeId) !== String(args.eventTypeId)) {
      throw new Error("A remarcação deve manter o mesmo tipo de atendimento.");
    }

    const eventType = await ctx.db.get(args.eventTypeId);
    if (!eventType || !eventType.active) {
      throw new Error("Este atendimento não está disponível para remarcação.");
    }
    if (eventType.slug !== args.eventType) {
      throw new Error("O tipo de atendimento informado não corresponde ao evento da consulta.");
    }
    const availability = eventType.availabilityId ? await ctx.db.get(eventType.availabilityId) : null;
    if (!availability) {
      throw new Error("Evento sem disponibilidade configurada.");
    }

    const slotTimestamp = parseIsoDateAndTimeToTimestamp(args.date, args.time, availability.timezone);
    assertRescheduleWindow(
      slotTimestamp,
      now,
      typeof scheduledFor === "number" ? scheduledFor : null,
      isClinicInitiatedReschedule,
    );
    await assertSlotIsAvailable(ctx, eventType, args.date, args.time, identity.subject);

    const previousScheduledFor = appointment.scheduledFor ?? null;
    const previousReservationId = appointment.reservationId ?? null;
    const endsAt = slotTimestamp + eventType.durationMinutes * 60_000;
    if (policy.requiresPaidReschedule) {
      const allReservations = await ctx.db
        .query("reservations")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
        .collect();
      const pendingDrafts = allReservations.filter(
        (item) =>
          item.appointmentId === appointment._id &&
          item.status === "pending" &&
          getReservationHoldExpiresAt(item) > now,
      );
      for (const pendingDraft of pendingDrafts) {
        await ctx.db.patch(pendingDraft._id, {
          status: "cancelled",
          notes: "Rascunho de pagamento substituído por nova tentativa de remarcação.",
          updatedAt: now,
        });
        const pendingPayment = await ctx.db
          .query("payments")
          .withIndex("by_reservation_id", (q) => q.eq("reservationId", pendingDraft._id))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first();
        if (pendingPayment) {
          await ctx.db.patch(pendingPayment._id, {
            status: "failed",
            notes: "Pagamento pendente substituído por nova tentativa de remarcação.",
            updatedAt: now,
          });
        }
      }

      const paymentMode = eventType.paymentMode ?? "booking_fee";
      const consultationAmountCents = normalizeAmountCents(eventType.priceCents);
      if (!consultationAmountCents || consultationAmountCents <= 0) {
        throw new Error("Não foi possível calcular a taxa para novo reagendamento.");
      }
      const amountCents = paymentMode === "full_payment"
        ? consultationAmountCents
        : paymentMode === "in_person"
          ? 0
          : calculateReservationFeeCents(consultationAmountCents, RESERVATION_FEE_PERCENT);
      if (!amountCents || amountCents <= 0) {
        throw new Error("Não foi possível calcular a nova taxa de reserva para remarcação.");
      }

      const holdExpiresAt = now + RESCHEDULE_CHECKOUT_HOLD_DURATION_MS;
      const newReservationId = await ctx.db.insert("reservations", {
        clerkUserId: identity.subject,
        eventTypeId: eventType._id,
        availabilityId: availability._id,
        appointmentId: appointment._id,
        startsAt: slotTimestamp,
        endsAt,
        holdExpiresAt,
        status: "pending",
        notes:
          "Reagendamento adicional solicitado. Aguardando pagamento de nova taxa de reserva.",
        createdAt: now,
        updatedAt: now,
      });
      const paymentId = await ctx.db.insert("payments", {
        clerkUserId: identity.subject,
        reservationId: newReservationId,
        amountCents,
        currency: "BRL",
        method: "card",
        status: "pending",
        notes: "Checkout Stripe iniciado para remarcação adicional.",
        createdAt: now,
        updatedAt: now,
      });

      return {
        ok: true,
        kind: "payment_required" as const,
        appointmentId: appointment._id,
        reservationId: newReservationId,
        paymentId,
        amountCents,
        currency: "BRL" as const,
        consultationType: eventType.name ?? eventType.title ?? eventType.slug,
        eventTypeSlug: eventType.slug,
        holdExpiresAt,
        scheduledFor: slotTimestamp,
      };
    }

    const newReservationId = await ctx.db.insert("reservations", {
      clerkUserId: identity.subject,
      eventTypeId: eventType._id,
      availabilityId: availability._id,
      appointmentId: appointment._id,
      startsAt: slotTimestamp,
      endsAt,
      status: "confirmed",
      notes: "Reserva remarcada pelo paciente sem custo adicional.",
      createdAt: now,
      updatedAt: now,
    });

    if (previousReservationId) {
      const previousReservation = await ctx.db.get(previousReservationId);
      if (
        previousReservation &&
        (previousReservation.status === "confirmed" || previousReservation.status === "awaiting_reschedule")
      ) {
        await ctx.db.patch(previousReservationId, {
          status: "cancelled",
          notes: isClinicInitiatedReschedule
            ? "Reserva anterior indisponível e substituída por novo horário escolhido pelo paciente."
            : "Reserva substituída por remarcação realizada pelo paciente.",
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(appointment._id, {
      eventTypeId: eventType._id,
      reservationId: newReservationId,
      preferredPeriod: inferPreferredPeriod(slotTimestamp),
      status: "rescheduled",
      scheduledFor: slotTimestamp,
      consultationType: eventType.name ?? eventType.title ?? eventType.slug,
      updatedAt: now,
    });

    await ctx.db.insert("appointment_events", {
      appointmentId: appointment._id,
      clerkUserId: identity.subject,
      eventType: "rescheduled",
      notes: "Remarcação concluída no painel do paciente sem custo adicional.",
      payload: JSON.stringify({
        previousScheduledFor,
        newScheduledFor: slotTimestamp,
        previousReservationId,
        newReservationId,
      }),
      createdAt: now,
    });

    return {
      ok: true,
      kind: "rescheduled" as const,
      appointmentId: appointment._id,
      scheduledFor: slotTimestamp,
      consultationType: eventType.name ?? eventType.title ?? eventType.slug,
    };
  },
});

export const cancelOwnAppointment = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .collect();
    await markOverdueAppointmentsAsNoShow(ctx, appointments, now);
    const sorted = [...appointments].sort((a, b) => b.requestedAt - a.requestedAt);
    const appointment = sorted.find((item) => isAppointmentCurrentlyActive(item, now)) ?? null;
    if (!appointment) {
      throw new Error("Nenhuma consulta ativa encontrada para cancelamento.");
    }

    const linkedReservation = appointment.reservationId ? await ctx.db.get(appointment.reservationId) : null;
    const isClinicInitiatedReschedule = linkedReservation?.status === "awaiting_reschedule";
    const scheduledFor = appointment.scheduledFor;
    if (typeof scheduledFor !== "number" && !isClinicInitiatedReschedule) {
      throw new Error("Esta consulta ainda não possui horário definido para cancelamento automático.");
    }
    if (
      !isClinicInitiatedReschedule &&
      typeof scheduledFor === "number" &&
      scheduledFor - now < RESCHEDULE_MIN_NOTICE_MS
    ) {
      throw new Error("Cancelamento disponível somente com no mínimo 24h de antecedência.");
    }

    if (appointment.reservationId) {
      if (
        linkedReservation &&
        (linkedReservation.status === "confirmed" ||
          linkedReservation.status === "pending" ||
          linkedReservation.status === "awaiting_patient" ||
          linkedReservation.status === "awaiting_reschedule" ||
          linkedReservation.status === "in_care" ||
          linkedReservation.status === "surgery_planned" ||
          linkedReservation.status === "postop_followup")
      ) {
        await ctx.db.patch(linkedReservation._id, {
          status: "cancelled",
          notes: isClinicInitiatedReschedule
            ? "Reserva cancelada sem custo pelo paciente após indisponibilidade do horário original."
            : "Reserva cancelada pelo paciente com antecedência mínima de 24h.",
          updatedAt: now,
        });
      }

      const linkedPayment = await ctx.db
        .query("payments")
        .withIndex("by_reservation_id", (q) => q.eq("reservationId", appointment.reservationId!))
        .first();
      if (linkedPayment?.status === "paid") {
        await ctx.db.patch(linkedPayment._id, {
          status: "refunded",
          notes: isClinicInitiatedReschedule
            ? "Reembolso integral por cancelamento sem custo após indisponibilidade do horário original."
            : "Reembolso integral elegível por cancelamento com mais de 24h de antecedência.",
          updatedAt: now,
        });
      } else if (linkedPayment?.status === "pending") {
        await ctx.db.patch(linkedPayment._id, {
          status: "failed",
          notes: "Pagamento cancelado após cancelamento da consulta pelo paciente.",
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(appointment._id, {
      status: "cancelled",
      updatedAt: now,
    });
    await ctx.db.insert("appointment_events", {
      appointmentId: appointment._id,
      clerkUserId: identity.subject,
      eventType: "cancelled",
      notes: isClinicInitiatedReschedule
        ? "Consulta cancelada sem custo no painel após indisponibilidade do horário original."
        : "Consulta cancelada pelo paciente no painel com antecedência mínima de 24h e elegível a reembolso integral da taxa de reserva.",
      createdAt: now,
    });

    return { ok: true, appointmentId: appointment._id };
  },
});

export const getLatestActiveAppointment = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    const now = Date.now();
    const sorted = [...appointments].sort((a, b) => b.requestedAt - a.requestedAt);
    return sorted.find((item) => isAppointmentCurrentlyActive(item, now)) ?? null;
  },
});

async function findOrCreatePatient(
  ctx: MutationCtx,
  clerkUserId: string,
  name: string,
  phone: string,
  email: string,
  now: number,
) {
  const existing = await ctx.db
    .query("patients")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      name,
      phone,
      email,
      updatedAt: now,
    });
    return existing;
  }

  const patientId: Id<"patients"> = await ctx.db.insert("patients", {
    clerkUserId,
    name,
    phone,
    email,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ctx.db.get(patientId);
  if (!created) {
    throw new Error("Could not create patient");
  }
  return created as Doc<"patients">;
}

async function assertCanCreateNewBooking(ctx: MutationCtx, clerkUserId: string, now: number) {
  const [appointments, reservations] = await Promise.all([
    ctx.db
      .query("appointments")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .collect(),
    ctx.db
      .query("reservations")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .collect(),
  ]);

  await markOverdueAppointmentsAsNoShow(ctx, appointments, now);

  const hasActiveAppointment = appointments.some(
    (item) => isAppointmentCurrentlyActive(item, now),
  );
  if (hasActiveAppointment) {
    throw new Error(
      "Você já possui um agendamento ativo. Para remarcar ou gerenciar sua consulta, acesse seu painel.",
    );
  }

  const hasPendingReschedule = reservations.some(
    (item) => item.status === "pending" && getReservationHoldExpiresAt(item) > now,
  );
  if (hasPendingReschedule) {
    throw new Error(
      "Você já possui um agendamento aguardando remarcação. Finalize ou cancele o pendente atual.",
    );
  }
}

function clampDaysAhead(value: number) {
  if (value < 1) {
    return 1;
  }
  if (value > 3650) {
    return 3650;
  }
  return Math.floor(value);
}

async function buildReschedulePolicy(
  ctx: MutationCtx | QueryCtx,
  appointment: Doc<"appointments">,
  now: number,
) {
  const eventType = appointment.eventTypeId ? await ctx.db.get(appointment.eventTypeId) : null;
  const paymentMode = eventType?.paymentMode ?? "booking_fee";
  const linkedReservation = appointment.reservationId
    ? await ctx.db.get(appointment.reservationId)
    : null;
  const isClinicInitiatedReschedule = linkedReservation?.status === "awaiting_reschedule";
  const history = await ctx.db
    .query("appointment_events")
    .withIndex("by_appointment_id", (q) => q.eq("appointmentId", appointment._id))
    .collect();
  const reschedulesUsed = history.filter((item) => item.eventType === "rescheduled").length;
  const reachedRescheduleLimit = reschedulesUsed >= RESCHEDULE_MAX_PER_APPOINTMENT;

  if (isClinicInitiatedReschedule) {
    if (paymentMode === "in_person" && reachedRescheduleLimit) {
      return {
        canReschedule: false,
        canCancel: true,
        isClinicInitiatedReschedule: true,
        cancelReason: null,
        requiresHumanSupport: false,
        reason: "Para consultas com pagamento presencial, apenas 1 remarcação é permitida.",
        maxReschedules: RESCHEDULE_MAX_PER_APPOINTMENT,
        reschedulesUsed,
        minNoticeHours: 24,
        maxDaysAhead: RESCHEDULE_MAX_DAYS_AHEAD,
        requiresPaidReschedule: false,
        paidRescheduleAmountCents: null,
      };
    }
    return {
      canReschedule: true,
      canCancel: true,
      isClinicInitiatedReschedule: true,
      cancelReason: null,
      requiresHumanSupport: false,
      reason: "A clínica ajustou a agenda. Escolha um novo horário ou cancele sem custo.",
      maxReschedules: RESCHEDULE_MAX_PER_APPOINTMENT,
      reschedulesUsed: 0,
      minNoticeHours: 24,
      maxDaysAhead: RESCHEDULE_MAX_DAYS_AHEAD,
      requiresPaidReschedule: false,
      paidRescheduleAmountCents: null,
    };
  }

  const scheduledFor = appointment.scheduledFor;
  if (typeof scheduledFor !== "number") {
    return {
      canReschedule: false,
      canCancel: false,
      isClinicInitiatedReschedule: false,
      cancelReason: "Consulta ainda sem horário definido.",
      requiresHumanSupport: false,
      reason: "Consulta ainda sem horário definido.",
      maxReschedules: RESCHEDULE_MAX_PER_APPOINTMENT,
      reschedulesUsed: 0,
      minNoticeHours: 24,
      maxDaysAhead: RESCHEDULE_MAX_DAYS_AHEAD,
      requiresPaidReschedule: false,
      paidRescheduleAmountCents: null,
    };
  }

  const consultationAmountCents = normalizeAmountCents(eventType?.priceCents);
  const paidRescheduleAmountCents =
    paymentMode === "full_payment"
      ? consultationAmountCents ?? null
      : paymentMode === "in_person"
        ? null
        : consultationAmountCents
          ? calculateReservationFeeCents(consultationAmountCents, RESERVATION_FEE_PERCENT)
          : null;

  if (reschedulesUsed >= RESCHEDULE_MAX_PER_APPOINTMENT) {
    const requiresPaidReschedule = Boolean(
      typeof paidRescheduleAmountCents === "number" && paidRescheduleAmountCents > 0,
    );
    return {
      canReschedule: requiresPaidReschedule,
      canCancel: true,
      isClinicInitiatedReschedule: false,
      cancelReason: null,
      requiresHumanSupport: false,
      reason: paymentMode === "in_person"
        ? "Para consultas com pagamento presencial, apenas 1 remarcação é permitida."
        : requiresPaidReschedule
          ? "Você já utilizou a remarcação sem custo. A próxima remarcação exige nova taxa de reserva."
          : "Você já utilizou o limite de 1 remarcação sem custo.",
      maxReschedules: RESCHEDULE_MAX_PER_APPOINTMENT,
      reschedulesUsed,
      minNoticeHours: 24,
      maxDaysAhead: RESCHEDULE_MAX_DAYS_AHEAD,
      requiresPaidReschedule,
      paidRescheduleAmountCents: requiresPaidReschedule ? paidRescheduleAmountCents : null,
    };
  }

  if (scheduledFor - now < RESCHEDULE_MIN_NOTICE_MS) {
    return {
      canReschedule: false,
      canCancel: false,
      isClinicInitiatedReschedule: false,
      cancelReason: "Cancelamento disponível somente a partir de 24h de antecedência da consulta.",
      requiresHumanSupport: true,
      reason: "Remarcação disponível somente a partir de 24h de antecedência da consulta.",
      maxReschedules: RESCHEDULE_MAX_PER_APPOINTMENT,
      reschedulesUsed,
      minNoticeHours: 24,
      maxDaysAhead: RESCHEDULE_MAX_DAYS_AHEAD,
      requiresPaidReschedule: false,
      paidRescheduleAmountCents: null,
    };
  }

  return {
    canReschedule: true,
    canCancel: true,
    isClinicInitiatedReschedule: false,
    cancelReason: null,
    requiresHumanSupport: false,
    reason: null,
    maxReschedules: RESCHEDULE_MAX_PER_APPOINTMENT,
    reschedulesUsed,
    minNoticeHours: 24,
    maxDaysAhead: RESCHEDULE_MAX_DAYS_AHEAD,
    requiresPaidReschedule: false,
    paidRescheduleAmountCents: null,
  };
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
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }
  return new Date(year, month - 1, day, 12, 0, 0);
}

function normalizeTargetDate(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return undefined;
  }
  return normalized;
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

function formatDateInTimezone(timestamp: number, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function formatTimeInTimezone(timestamp: number, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function buildSlotKey(groupName: string, isoDate: string, time: string) {
  return `${groupName}|${isoDate}|${time}`;
}

function buildOverrideKey(groupName: string, isoDate: string) {
  return `${groupName}|${isoDate}`;
}

function isReservationBlocking(
  reservation: Doc<"reservations">,
  now: number,
) {
  if (
    reservation.status === "confirmed" ||
    reservation.status === "in_care" ||
    reservation.status === "surgery_planned" ||
    reservation.status === "postop_followup"
  ) {
    return true;
  }
  if (reservation.status === "awaiting_patient") {
    return true;
  }
  if (reservation.status !== "pending") {
    return false;
  }
  return getReservationHoldExpiresAt(reservation) > now;
}

function getReservationHoldExpiresAt(reservation: Doc<"reservations">) {
  return reservation.holdExpiresAt ?? reservation.updatedAt + RESERVATION_HOLD_DURATION_MS;
}

function isAppointmentInActiveWindow(appointment: Doc<"appointments">) {
  return appointment.status === "confirmed" || appointment.status === "rescheduled";
}

function hasAppointmentStarted(appointment: Doc<"appointments">, now: number) {
  return typeof appointment.scheduledFor === "number" && appointment.scheduledFor <= now;
}

function isAppointmentCurrentlyActive(appointment: Doc<"appointments">, now: number) {
  return isAppointmentInActiveWindow(appointment) && !hasAppointmentStarted(appointment, now);
}

function deriveAppointmentStatus(appointment: Doc<"appointments">, now: number) {
  if (isAppointmentInActiveWindow(appointment) && hasAppointmentStarted(appointment, now)) {
    return "no_show" as const;
  }
  return appointment.status;
}

async function markOverdueAppointmentsAsNoShow(
  ctx: MutationCtx,
  appointments: Doc<"appointments">[],
  now: number,
) {
  const overdueAppointments = appointments.filter(
    (item) => isAppointmentInActiveWindow(item) && hasAppointmentStarted(item, now),
  );
  if (overdueAppointments.length === 0) {
    return;
  }

  for (const appointment of overdueAppointments) {
    await ctx.db.patch(appointment._id, {
      status: "no_show",
      updatedAt: now,
    });

    if (appointment.reservationId) {
      const reservation = await ctx.db.get(appointment.reservationId);
      if (
        reservation &&
        (reservation.status === "confirmed" ||
          reservation.status === "pending" ||
          reservation.status === "awaiting_patient" ||
          reservation.status === "in_care" ||
          reservation.status === "surgery_planned" ||
          reservation.status === "postop_followup")
      ) {
        await ctx.db.patch(reservation._id, {
          status: "cancelled",
          notes:
            "Reserva encerrada automaticamente por no-show após ultrapassar o horário de início.",
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("appointment_events", {
      appointmentId: appointment._id,
      clerkUserId: appointment.clerkUserId,
      eventType: "no_show",
      notes:
        "Consulta marcada como no_show automaticamente após ultrapassar o horário de início.",
      createdAt: now,
    });
  }
}

function isIsoDateTimeInFutureForTimezone(
  isoDate: string,
  time: string,
  timezone: string,
  now: number,
) {
  const currentDate = formatDateInTimezone(now, timezone);
  if (isoDate > currentDate) {
    return true;
  }
  if (isoDate < currentDate) {
    return false;
  }
  const currentTime = formatTimeInTimezone(now, timezone);
  return time > currentTime;
}

function isIsoDateTimeAtLeastMinNotice(
  isoDate: string,
  time: string,
  timezone: string,
  now: number,
  minNoticeMs: number,
) {
  try {
    const slotTimestamp = parseIsoDateAndTimeToTimestamp(isoDate, time, timezone);
    return slotTimestamp - now >= minNoticeMs;
  } catch {
    return false;
  }
}

function isUrgencyEventType(
  eventType: Pick<Doc<"event_types">, "slug" | "title" | "name"> | undefined,
) {
  if (!eventType) {
    return false;
  }
  const normalized = [eventType.slug, eventType.title, eventType.name]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return /(urgenc|urgente|emergenc)/.test(normalized);
}

function resolveAvailabilityGroupName(availability: { name?: string; _id?: unknown } | undefined) {
  if (!availability) {
    return "Disponibilidade";
  }
  const normalized = availability.name?.trim();
  if (normalized && normalized.length > 0) {
    return normalized;
  }
  return `Disponibilidade-${String(availability._id ?? "sem-id")}`;
}

function assertRescheduleWindow(
  slotTimestamp: number,
  now: number,
  currentAppointmentTimestamp: number | null,
  isClinicInitiatedReschedule: boolean,
) {
  if (!Number.isFinite(slotTimestamp)) {
    throw new Error("Novo horário inválido para remarcação.");
  }
  if (!isClinicInitiatedReschedule && slotTimestamp - now < RESCHEDULE_MIN_NOTICE_MS) {
    throw new Error("Escolha um horário com no mínimo 24h de antecedência.");
  }
  const referenceTimestamp = currentAppointmentTimestamp ?? now;
  const maxAllowedTimestamp = referenceTimestamp + RESCHEDULE_MAX_DAYS_AHEAD * 24 * 60 * 60_000;
  if (slotTimestamp > maxAllowedTimestamp) {
    throw new Error("A nova data deve estar até 30 dias após a data do agendamento atual.");
  }
}

async function assertSlotIsAvailable(
  ctx: MutationCtx,
  eventType: Doc<"event_types">,
  isoDate: string,
  time: string,
  excludedClerkUserId?: string,
) {
  if (!eventType.availabilityId) {
    throw new Error("Evento sem disponibilidade configurada.");
  }
  const referenceAvailability = await ctx.db.get(eventType.availabilityId);
  if (!referenceAvailability) {
    throw new Error("Disponibilidade base não encontrada.");
  }
  const groupName = resolveAvailabilityGroupName(referenceAvailability);
  const weekday = new Date(`${isoDate}T12:00:00`).getDay();
  const now = Date.now();
  if (Number.isNaN(weekday)) {
    throw new Error("Data inválida.");
  }
  if (!isValidTimeValue(time)) {
    throw new Error("Horário inválido.");
  }
  if (!isIsoDateTimeInFutureForTimezone(isoDate, time, referenceAvailability.timezone, now)) {
    throw new Error("Horário já está no passado. Escolha um horário futuro.");
  }
  if (
    !isUrgencyEventType(eventType) &&
    !isIsoDateTimeAtLeastMinNotice(
      isoDate,
      time,
      referenceAvailability.timezone,
      now,
      BOOKING_MIN_NOTICE_MS,
    )
  ) {
    throw new Error("Escolha um horário com no mínimo 48h de antecedência.");
  }

  const [allAvailabilities, allOverrides, allReservations] = await Promise.all([
    ctx.db.query("availabilities").collect(),
    ctx.db.query("availability_overrides").collect(),
    ctx.db.query("reservations").collect(),
  ]);
  const override = allOverrides.find((item) => item.groupName === groupName && item.date === isoDate);
  const groupAvailabilities = allAvailabilities.filter(
    (item) => item.status === "active" && resolveAvailabilityGroupName(item) === groupName,
  );
  if (!override && groupAvailabilities.length === 0) {
    throw new Error("Sem disponibilidade ativa para o evento.");
  }
  const availableSlots = new Set<string>();
  if (override) {
    if (!override.allDayUnavailable) {
      const activeSlots = override.slots.filter((slot) => slot.status === "active");
      for (const slot of activeSlots) {
        for (const generatedSlot of buildSlotsWithinRange(
          slot.startTime,
          slot.endTime,
          eventType.durationMinutes,
        )) {
          availableSlots.add(generatedSlot);
        }
      }
    }
  } else {
    const weekdaySlots = groupAvailabilities.filter((item) => item.weekday === weekday);
    for (const weeklySlot of weekdaySlots) {
      for (const generatedSlot of buildSlotsWithinRange(
        weeklySlot.startTime,
        weeklySlot.endTime,
        eventType.durationMinutes,
      )) {
        availableSlots.add(generatedSlot);
      }
    }
  }

  if (!availableSlots.has(time)) {
    throw new Error("Horário não está mais disponível para este evento.");
  }

  const activeReservations = allReservations.filter(
    (reservation) =>
      reservation.eventTypeId === eventType._id &&
      isReservationBlocking(reservation, now) &&
      reservation.clerkUserId !== excludedClerkUserId,
  );
  const reservedKeys = new Set<string>();
  for (const reservation of activeReservations) {
    const availability = allAvailabilities.find((item) => item._id === reservation.availabilityId);
    if (!availability) {
      continue;
    }
    const reservationGroup = resolveAvailabilityGroupName(availability);
    const dateKey = formatDateInTimezone(reservation.startsAt, availability.timezone);
    const timeKey = formatTimeInTimezone(reservation.startsAt, availability.timezone);
    reservedKeys.add(buildSlotKey(reservationGroup, dateKey, timeKey));
  }

  if (reservedKeys.has(buildSlotKey(groupName, isoDate, time))) {
    throw new Error("Este horário acabou de ser reservado. Escolha outro horário.");
  }
}

function parseIsoDateAndTimeToTimestamp(date: string, time: string, timezone: string) {
  const normalizedDate = date.trim();
  const normalizedTime = time.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) || !isValidTimeValue(normalizedTime)) {
    throw new Error("Data ou horário inválidos.");
  }

  const [yearRaw, monthRaw, dayRaw] = normalizedDate.split("-");
  const [hourRaw, minuteRaw] = normalizedTime.split(":");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    throw new Error("Data ou horário inválidos.");
  }

  const desiredWallClockUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let timestamp = desiredWallClockUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offsetMs = getTimezoneOffsetMs(timezone, timestamp);
    timestamp = desiredWallClockUtc - offsetMs;
  }

  const resolvedDate = formatDateInTimezone(timestamp, timezone);
  const resolvedTime = formatTimeInTimezone(timestamp, timezone);
  if (resolvedDate !== normalizedDate || resolvedTime !== normalizedTime) {
    throw new Error("Data ou horário inválidos para o fuso horário da disponibilidade.");
  }

  return timestamp;
}

function getTimezoneOffsetMs(timezone: string, timestamp: number) {
  const zonedParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date(timestamp))
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const zonedTimestampAsUtc = Date.UTC(
    Number(zonedParts.year ?? "0"),
    Number(zonedParts.month ?? "1") - 1,
    Number(zonedParts.day ?? "1"),
    Number(zonedParts.hour ?? "0"),
    Number(zonedParts.minute ?? "0"),
    Number(zonedParts.second ?? "0"),
    0,
  );
  return zonedTimestampAsUtc - timestamp;
}

function isValidTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function inferPreferredPeriod(timestamp: number) {
  const hour = new Date(timestamp).getHours();
  if (hour < 12) {
    return "manha" as const;
  }
  if (hour < 18) {
    return "tarde" as const;
  }
  return "noite" as const;
}

function normalizeAmountCents(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  if (!Number.isInteger(value)) {
    if (value >= 1000) {
      return Math.round(value);
    }
    return Math.round(value * 100);
  }
  if (value >= 1000) {
    return value;
  }
  return value * 100;
}

function calculateReservationFeeCents(
  consultationAmountCents: number,
  reservationFeePercent: number,
) {
  if (!Number.isFinite(consultationAmountCents) || consultationAmountCents <= 0) {
    return 0;
  }
  if (!Number.isFinite(reservationFeePercent) || reservationFeePercent <= 0) {
    return 0;
  }
  return Math.round((consultationAmountCents * reservationFeePercent) / 100);
}

