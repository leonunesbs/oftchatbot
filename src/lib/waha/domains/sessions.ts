import { serverEnv } from "@/lib/env/server";
import { requestWaha, WahaHttpError } from "@/lib/waha/http-client";
import { wahaSessionSchema } from "@/lib/waha/schemas";
import type { WahaSession } from "@/lib/waha/types";

function normalizeSessions(rawData: unknown): WahaSession[] {
  const rawSessions = Array.isArray(rawData) ? rawData : [];
  return rawSessions
    .map((item) => wahaSessionSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
}

export const sessionsDomain = {
  async list(): Promise<WahaSession[]> {
    const response = await requestWaha({ path: "sessions" });
    return normalizeSessions(response.body);
  },
  async get(name = serverEnv.WAHA_DEFAULT_SESSION): Promise<WahaSession | null> {
    const response = await requestWaha({ path: `sessions/${name}` });
    const parsed = wahaSessionSchema.safeParse(response.body);
    return parsed.success ? parsed.data : null;
  },
  async create(name = serverEnv.WAHA_DEFAULT_SESSION, start = true) {
    return requestWaha({
      path: "sessions",
      method: "POST",
      body: { name, start },
    });
  },
  async ensure(name = serverEnv.WAHA_DEFAULT_SESSION): Promise<WahaSession | null> {
    let session: WahaSession | null = null;

    try {
      session = await this.get(name);
    } catch (error) {
      if (!(error instanceof WahaHttpError) || error.status !== 404) {
        throw error;
      }

      try {
        await this.create(name, true);
      } catch (createError) {
        // Handle races where another request created the same session first.
        if (!(createError instanceof WahaHttpError) || createError.status !== 422) {
          throw createError;
        }
      }
      session = await this.get(name);
    }

    if (!session) {
      return null;
    }

    if (session.status === "STOPPED") {
      await this.start(name);
      return this.get(name);
    }

    return session;
  },
  async start(name = serverEnv.WAHA_DEFAULT_SESSION) {
    return requestWaha({ path: `sessions/${name}/start`, method: "POST" });
  },
  async stop(name = serverEnv.WAHA_DEFAULT_SESSION) {
    return requestWaha({ path: `sessions/${name}/stop`, method: "POST" });
  },
  async restart(name = serverEnv.WAHA_DEFAULT_SESSION) {
    return requestWaha({ path: `sessions/${name}/restart`, method: "POST" });
  },
  async getQr(name = serverEnv.WAHA_DEFAULT_SESSION) {
    return requestWaha({
      path: `${name}/auth/qr`,
      searchParams: { format: "raw" },
    });
  },
  async requestCode(
    phoneNumber: string,
    method?: "sms" | "voice",
    name = serverEnv.WAHA_DEFAULT_SESSION
  ) {
    return requestWaha({
      path: `${name}/auth/request-code`,
      method: "POST",
      body: {
        phoneNumber,
        ...(method ? { method } : {}),
      },
    });
  },
};
