import { serverEnv } from "@/lib/env/server";
import { requestWaha, WahaHttpError } from "@/lib/waha/http-client";
import { wahaSessionSchema } from "@/lib/waha/schemas";
import type { WahaSession } from "@/lib/waha/types";

const WAHA_WEBHOOK_EVENTS = [
  "session.status",
  "message",
  "message.reaction",
  "message.any",
  "message.ack",
  "message.ack.group",
  "message.revoked",
  "message.edited",
  "group.v2.join",
  "group.v2.leave",
  "group.v2.update",
  "group.v2.participants",
  "presence.update",
  "poll.vote",
  "poll.vote.failed",
  "chat.archive",
  "call.received",
  "call.accepted",
  "call.rejected",
  "label.upsert",
  "label.deleted",
  "label.chat.added",
  "label.chat.deleted",
  "event.response",
  "event.response.failed",
  "engine.event",
  "group.join",
  "group.leave",
] as const;

const configuredWebhookSessions = new Map<string, string>();

function getWebhookUrl() {
  const configured = serverEnv.WAHA_WEBHOOK_URL;
  const baseUrl = configured ?? "http://host.docker.internal:3030/api/waha/webhook";

  try {
    const parsed = new URL(baseUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.hostname = "host.docker.internal";
    }

    // WAHA versions differ in webhook header support; keep a URL token fallback.
    if (serverEnv.WAHA_WEBHOOK_SECRET && !parsed.searchParams.has("secret") && !parsed.searchParams.has("token")) {
      parsed.searchParams.set("secret", serverEnv.WAHA_WEBHOOK_SECRET);
    }

    return parsed.toString();
  } catch {
    if (configured) {
      return configured;
    }
    return "http://host.docker.internal:3030/api/waha/webhook";
  }
}

function getWebhookHeaders() {
  const headers: Record<string, string> = {};
  if (serverEnv.WAHA_WEBHOOK_SECRET) {
    headers["x-waha-secret"] = serverEnv.WAHA_WEBHOOK_SECRET;
    headers.authorization = `Bearer ${serverEnv.WAHA_WEBHOOK_SECRET}`;
  }
  if (serverEnv.WAHA_API_KEY) {
    headers["x-api-key"] = serverEnv.WAHA_API_KEY;
  }

  if (Object.keys(headers).length === 0) {
    return undefined;
  }
  return headers;
}

async function configureSessionWebhooks(sessionName: string) {
  const webhookUrl = getWebhookUrl();
  if (configuredWebhookSessions.get(sessionName) === webhookUrl) {
    return;
  }
  const webhookHeaders = getWebhookHeaders();
  const candidates: Array<{
    path: string;
    method: "POST" | "PUT";
    body: Record<string, unknown>;
  }> = [
    {
      path: `sessions/${sessionName}`,
      method: "PUT",
      body: {
        config: {
          webhooks: [
            {
              url: webhookUrl,
              events: [...WAHA_WEBHOOK_EVENTS],
              ...(webhookHeaders ? { headers: webhookHeaders } : {}),
            },
          ],
        },
      },
    },
    {
      path: `sessions/${sessionName}/webhooks`,
      method: "POST",
      body: {
        url: webhookUrl,
        events: [...WAHA_WEBHOOK_EVENTS],
        ...(webhookHeaders ? { headers: webhookHeaders } : {}),
      },
    },
    {
      path: "webhooks",
      method: "POST",
      body: {
        session: sessionName,
        url: webhookUrl,
        events: [...WAHA_WEBHOOK_EVENTS],
        ...(webhookHeaders ? { headers: webhookHeaders } : {}),
      },
    },
  ];

  let configured = false;
  for (const candidate of candidates) {
    try {
      await requestWaha({
        path: candidate.path,
        method: candidate.method,
        body: candidate.body,
      });
      configured = true;
      break;
    } catch (error) {
      if (error instanceof WahaHttpError) {
        continue;
      }
      throw error;
    }
  }

  if (configured) {
    configuredWebhookSessions.set(sessionName, webhookUrl);
    console.info("[WAHA sessions] webhook configured", JSON.stringify({ session: sessionName, webhookUrl }));
    return;
  }

  console.warn(
    "[WAHA sessions] unable to configure webhook automatically",
    JSON.stringify({ session: sessionName, webhookUrl })
  );
}

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
      const restartedSession = await this.get(name);
      if (restartedSession) {
        await configureSessionWebhooks(name);
      }
      return restartedSession;
    }

    await configureSessionWebhooks(name);
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
