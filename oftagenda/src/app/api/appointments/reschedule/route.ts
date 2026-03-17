import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { clerkClient } from "@clerk/nextjs/server";
import StripeSdk from "stripe";

import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { bookingCheckoutSchema } from "@/domain/booking/schema";
import { requireMemberApiAccess } from "@/lib/access";
import { getAuthenticatedConvexHttpClient } from "@/lib/convex-server";
import { resolvePublicOrigin } from "@/lib/request-origin";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";
const CHECKOUT_SESSION_DURATION_SECONDS = 30 * 60;
const INTERNAL_RESCHEDULE_ERROR =
  "Não foi possível concluir a remarcação agora. Tente novamente em instantes.";

const reschedulePayloadSchema = bookingCheckoutSchema.extend({
  eventTypeId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    await requireMemberApiAccess();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha de autorização.";
    const status =
      message === "Not authenticated" ? 401 : message === "Not authorized" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }

  const body = await request.json().catch(() => null);
  const parsed = reschedulePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload de remarcação inválido.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const { client, userId } = await getAuthenticatedConvexHttpClient();
    const result = await client.mutation(api.appointments.rescheduleOwnAppointment, {
      eventTypeId: parsed.data.eventTypeId as Id<"event_types">,
      eventType: parsed.data.eventType,
      date: parsed.data.date,
      time: parsed.data.time,
    });
    if (result.kind === "payment_required") {
      const customerEmail = await getCustomerEmailByUserId(userId);
      const stripe = getStripeClient();
      const origin = resolvePublicOrigin(request);
      const desiredHoldExpiresAt =
        result.holdExpiresAt ?? Date.now() + CHECKOUT_SESSION_DURATION_SECONDS * 1000;
      const lineItems: StripeSdk.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: (result.currency ?? "BRL").toLowerCase(),
            unit_amount: result.amountCents,
            product_data: {
              name: result.consultationType || "Consulta oftalmológica",
              description:
                "Nova taxa de reserva para remarcação adicional. O novo horário só será confirmado após o pagamento.",
            },
          },
          quantity: 1,
        },
      ];
      try {
        const cancelParams = new URLSearchParams({
          payment: "cancelled",
          eventType: parsed.data.eventType,
          date: parsed.data.date,
          time: parsed.data.time,
        });
        const checkoutSessionParams: StripeSdk.Checkout.SessionCreateParams = {
          expires_at: Math.floor(desiredHoldExpiresAt / 1000),
          mode: "payment",
          line_items: lineItems,
          payment_intent_data: {
            metadata: {
              reservationId: String(result.reservationId),
              paymentId: String(result.paymentId),
              appointmentId: String(result.appointmentId),
              clerkUserId: String(userId),
              eventTypeSlug: result.eventTypeSlug,
              eventType: parsed.data.eventType,
              date: parsed.data.date,
              time: parsed.data.time,
              flow: "paid_reschedule",
            },
          },
          customer_email: customerEmail ?? undefined,
          success_url: `${origin}/dashboard?payment=success`,
          cancel_url: `${origin}/dashboard/reagendar?${cancelParams.toString()}`,
          metadata: {
            reservationId: String(result.reservationId),
            paymentId: String(result.paymentId),
            appointmentId: String(result.appointmentId),
            clerkUserId: String(userId),
            eventTypeSlug: result.eventTypeSlug,
            eventType: parsed.data.eventType,
            date: parsed.data.date,
            time: parsed.data.time,
            flow: "paid_reschedule",
          },
        };
        const session = await stripe.checkout.sessions.create(checkoutSessionParams);
        await client.mutation(api.stripe.attachCheckoutSession, {
          reservationId: result.reservationId,
          paymentId: result.paymentId,
          checkoutSessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          amountCents:
            typeof session.amount_total === "number" && session.amount_total > 0
              ? session.amount_total
              : result.amountCents,
          holdExpiresAt:
            typeof session.expires_at === "number" && Number.isFinite(session.expires_at)
              ? session.expires_at * 1000
              : result.holdExpiresAt,
        });
        if (!session.url) {
          throw new Error("Stripe não retornou URL de checkout.");
        }
        return NextResponse.json({
          ok: true,
          paymentRequired: true,
          url: session.url,
          amountCents: result.amountCents,
          currency: result.currency,
        });
      } catch (stripeError) {
        await client.mutation(api.stripe.releaseCheckoutDraft, {
          reservationId: result.reservationId,
          paymentId: result.paymentId,
          reason:
            stripeError instanceof Error
              ? `Falha ao criar checkout Stripe de remarcação: ${stripeError.message}`
              : "Falha ao criar checkout Stripe de remarcação.",
        });
        throw stripeError;
      }
    }

    return NextResponse.json({
      ok: true,
      appointmentId: result.appointmentId as Id<"appointments">,
      scheduledFor: result.scheduledFor,
      eventType: result.eventTypeSlug,
      consultationType: result.consultationType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao remarcar consulta.";
    console.error("[api/appointments/reschedule] Falha ao remarcar consulta.", {
      message,
    });
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 500;
    const publicMessage = status === 500 ? INTERNAL_RESCHEDULE_ERROR : toHumanReadableError(message);
    return NextResponse.json({ ok: false, error: publicMessage }, { status });
  }
}

async function getCustomerEmailByUserId(userId: string) {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const primaryEmailId = user.primaryEmailAddressId;
    if (primaryEmailId) {
      const primaryEmail = user.emailAddresses.find((item) => item.id === primaryEmailId);
      if (primaryEmail?.emailAddress) {
        return primaryEmail.emailAddress;
      }
    }
    return user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    return null;
  }
}

function toHumanReadableError(rawMessage: string) {
  const cleaned = rawMessage
    .replace(/\[Request ID:[^\]]+\]\s*/gi, "")
    .replace(/Server Error\s*/gi, "")
    .replace(/Uncaught Error:\s*/gi, "")
    .replace(/\s+at\s+[^\n]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) {
    return INTERNAL_RESCHEDULE_ERROR;
  }
  return cleaned;
}
