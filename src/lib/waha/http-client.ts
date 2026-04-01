import { serverEnv } from "@/lib/env/server";

type Primitive = string | number | boolean;
type SearchParamsRecord = Record<string, Primitive | Primitive[] | undefined>;

type WahaRequestOptions = {
  path: string;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  searchParams?: SearchParamsRecord;
  signal?: AbortSignal;
};

export class WahaHttpError extends Error {
  status: number;
  responseBody: unknown;

  constructor(message: string, status: number, responseBody: unknown) {
    super(message);
    this.name = "WahaHttpError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function buildWahaUrl(path: string, searchParams?: SearchParamsRecord) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const base = serverEnv.WAHA_BASE_URL.endsWith("/")
    ? serverEnv.WAHA_BASE_URL
    : `${serverEnv.WAHA_BASE_URL}/`;
  const url = new URL(normalizedPath, base);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "undefined") {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function requestWaha({
  path,
  method = "GET",
  body,
  headers,
  searchParams,
  signal,
}: WahaRequestOptions) {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), serverEnv.WAHA_TIMEOUT_MS);
  const url = buildWahaUrl(path, searchParams);
  const mergedSignal = signal ?? timeoutController.signal;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Api-Key": serverEnv.WAHA_API_KEY,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: mergedSignal,
      cache: "no-store",
    });

    const responseBody = await parseResponseBody(response);
    if (!response.ok) {
      throw new WahaHttpError(`WAHA request failed with status ${response.status}`, response.status, responseBody);
    }

    return {
      status: response.status,
      headers: response.headers,
      body: responseBody,
    };
  } finally {
    clearTimeout(timeout);
  }
}
