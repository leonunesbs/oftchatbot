import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/security/rate-limit";
import { WAHA_ALLOWED_METHODS, WAHA_DOMAIN_PREFIXES } from "@/lib/waha/constants";
import { WahaHttpError, requestWaha } from "@/lib/waha/http-client";

const ALLOWED_METHODS = new Set<string>(WAHA_ALLOWED_METHODS);
const ALLOWED_PREFIXES = new Set<string>(WAHA_DOMAIN_PREFIXES);

function parseBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  return request.text();
}

function normalizePrefix(pathSegments: string[]) {
  return pathSegments[0] ?? "";
}

async function handleProxy(method: string, request: NextRequest, pathSegments: string[]) {
  const callerIp = request.headers.get("x-forwarded-for") ?? "unknown";
  const limiter = rateLimit(`waha-proxy:${callerIp}`, 60_000, 180);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  if (!ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const prefix = normalizePrefix(pathSegments);
  if (!ALLOWED_PREFIXES.has(prefix)) {
    return NextResponse.json({ error: `Route prefix '${prefix}' is not allowed` }, { status: 403 });
  }

  const requestPath = pathSegments.join("/");
  const body = method === "GET" || method === "OPTIONS" ? undefined : await parseBody(request);
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const correlationId = request.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const requestHeaders = {
    Accept: request.headers.get("accept") ?? "application/json",
    "Content-Type": request.headers.get("content-type") ?? "application/json",
    "X-Correlation-Id": correlationId,
  };

  try {
    const response = await requestWaha({
      path: requestPath,
      method,
      headers: requestHeaders,
      body,
      searchParams,
    });
    console.info("[WAHA proxy]", JSON.stringify({ correlationId, method, requestPath, status: response.status }));
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    if (error instanceof WahaHttpError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.responseBody,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: "Unexpected WAHA proxy error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleProxy("GET", request, params.path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleProxy("POST", request, params.path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleProxy("PUT", request, params.path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleProxy("PATCH", request, params.path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleProxy("DELETE", request, params.path);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleProxy("OPTIONS", request, params.path);
}
