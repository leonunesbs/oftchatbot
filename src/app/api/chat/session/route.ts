import { NextResponse } from "next/server";

import { sessionsDomain } from "@/lib/waha/domains/sessions";
import { WahaHttpError } from "@/lib/waha/http-client";

export async function GET() {
  try {
    const session = await sessionsDomain.ensure();
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof WahaHttpError) {
      return NextResponse.json(
        {
          session: null,
          warning: "WAHA is unavailable. Session could not be loaded.",
          details: error.responseBody,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ session: null }, { status: 200 });
  }
}
