import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { chatsDomain, WahaSendPolicyError } from "@/lib/waha/domains/chats";
import { sendTextInputSchema } from "@/lib/waha/schemas";

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    if (error instanceof WahaSendPolicyError) {
      return NextResponse.json(
        {
          error: error.message,
          type: "ANTI_BLOCK_POLICY",
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to send message",
      },
      { status: 500 }
    );
  }
}
