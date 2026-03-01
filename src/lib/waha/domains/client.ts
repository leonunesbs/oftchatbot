import { requestWaha } from "@/lib/waha/http-client";

type QueryValue = string | number | boolean | undefined;

export type DomainCallOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path?: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

export type DomainClient = {
  prefix: string;
  list: (query?: Record<string, QueryValue>) => Promise<unknown>;
  get: (id: string, query?: Record<string, QueryValue>) => Promise<unknown>;
  create: (body: unknown) => Promise<unknown>;
  update: (id: string, body: unknown) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  call: (options?: DomainCallOptions) => Promise<unknown>;
};

function cleanPath(value?: string) {
  if (!value) {
    return "";
  }
  return value.replace(/^\/+/, "");
}

function joinPath(...parts: Array<string | undefined>) {
  return parts.map(cleanPath).filter(Boolean).join("/");
}

export function createDomainClient(prefix: string): DomainClient {
  return {
    prefix,
    async list(query) {
      const response = await requestWaha({ path: prefix, searchParams: query });
      return response.body;
    },
    async get(id, query) {
      const response = await requestWaha({ path: joinPath(prefix, id), searchParams: query });
      return response.body;
    },
    async create(body) {
      const response = await requestWaha({ path: prefix, method: "POST", body });
      return response.body;
    },
    async update(id, body) {
      const response = await requestWaha({
        path: joinPath(prefix, id),
        method: "PATCH",
        body,
      });
      return response.body;
    },
    async remove(id) {
      const response = await requestWaha({ path: joinPath(prefix, id), method: "DELETE" });
      return response.body;
    },
    async call({ method = "GET", path, query, body }: DomainCallOptions = {}) {
      const response = await requestWaha({
        path: joinPath(prefix, path),
        method,
        searchParams: query,
        body,
      });
      return response.body;
    },
  };
}
