import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { chatsDomain } from "@/lib/waha/domains/chats";
import { sendTextInputSchema } from "@/lib/waha/schemas";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const input = sendTextInputSchema.safeParse(payload);

  if (!input.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: input.error.flatten(),
      },
      { status: 400 }
    );
  }

  const response = await chatsDomain.sendText(input.data);
  return NextResponse.json(response.body, { status: response.status });
}
