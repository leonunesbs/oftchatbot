import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { oftagendaAdapter } from "@/lib/lumi/integrations/oftagenda";

const bookPayloadSchema = z.object({
  slotId: z.string().trim().min(2),
  fullName: z.string().trim().min(4),
  phone: z.string().trim().min(10),
  email: z.email().optional(),
  location: z.string().trim().min(2),
  consultationType: z.string().trim().min(2),
});

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = bookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const booking = await oftagendaAdapter.book(parsed.data);
  return NextResponse.json({
    ok: true,
    confirmation: {
      ...(booking.protocol ? { protocol: booking.protocol } : {}),
      source: booking.source,
      bookingUrl: booking.paymentUrl,
    },
  });
}
