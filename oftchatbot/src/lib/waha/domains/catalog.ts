export const WAHA_DOMAINS = {
  sessions: "sessions",
  chats: "chats",
  messages: "messages",
  sendText: "sendText",
  contacts: "contacts",
  groups: "groups",
  channels: "channels",
  status: "status",
  presence: "presence",
  labels: "labels",
  polls: "polls",
  calls: "calls",
  profile: "profile",
  events: "events",
  engines: "engines",
  storages: "storages",
  media: "media",
} as const;

export type WahaDomainName = keyof typeof WAHA_DOMAINS;
