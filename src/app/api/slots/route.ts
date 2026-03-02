import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { calComAdapter } from "@/lib/lumi/integrations/calcom";

const slotsSearchSchema = z.object({
  location: z.string().trim().min(2),
  consultationType: z.string().trim().min(2),
  date: z.string().trim().optional(),
  period: z.enum(["manha", "tarde", "noite"]).optional(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const parsed = slotsSearchSchema.safeParse({
    location: searchParams.get("location"),
    consultationType: searchParams.get("consultationType"),
    date: searchParams.get("date") ?? undefined,
    period: searchParams.get("period") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const slots = await calComAdapter.getSlots({
    location: parsed.data.location,
    consultationType: parsed.data.consultationType,
    dateIso: parsed.data.date,
    period: parsed.data.period,
  });

  return NextResponse.json({
    slots,
    count: slots.length,
  });
}
