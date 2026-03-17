import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getUserRoleFromClerkAuth, isClerkConfigured } from "@/lib/access";

export async function GET() {
  if (!isClerkConfigured()) {
    return NextResponse.json({
      clerkEnabled: false,
      isAuthenticated: false,
      userId: null,
      avatarUrl: null,
      firstName: null,
    });
  }

  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({
        clerkEnabled: true,
        isAuthenticated: false,
        userId: null,
        avatarUrl: null,
        firstName: null,
      });
    }

    const claims =
      sessionClaims && typeof sessionClaims === "object"
        ? (sessionClaims as Record<string, unknown>)
        : {};
    const firstName =
      typeof claims.given_name === "string"
        ? claims.given_name
        : typeof claims.first_name === "string"
          ? claims.first_name
          : null;
    await getUserRoleFromClerkAuth({ userId });

    return NextResponse.json({
      clerkEnabled: true,
      isAuthenticated: true,
      userId,
      // Avatar and names are not guaranteed in Clerk session token claims.
      avatarUrl: null,
      firstName,
    });
  } catch {
    // Session revalidation must sync role with Convex; if that fails we surface
    // an error response instead of downgrading the user to logged out state.
    return NextResponse.json({
      clerkEnabled: true,
      isAuthenticated: false,
      userId: null,
      avatarUrl: null,
      firstName: null,
    }, { status: 500 });
  }
}
