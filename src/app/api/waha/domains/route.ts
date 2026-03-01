import { NextResponse } from "next/server";

import { WAHA_DOMAINS } from "@/lib/waha/domains";

export async function GET() {
  return NextResponse.json({
    domains: WAHA_DOMAINS,
    usage: {
      proxy: "/api/waha/{domain}/{...path}",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
  });
}
