import { WAHA_DOMAINS } from "@/lib/waha/domains/catalog";
import { chatsDomain } from "@/lib/waha/domains/chats";
import { createDomainClient } from "@/lib/waha/domains/client";
import { sessionsDomain } from "@/lib/waha/domains/sessions";

export const wahaDomains = {
  sessions: sessionsDomain,
  chats: chatsDomain,
  messages: createDomainClient(WAHA_DOMAINS.messages),
  contacts: createDomainClient(WAHA_DOMAINS.contacts),
  groups: createDomainClient(WAHA_DOMAINS.groups),
  channels: createDomainClient(WAHA_DOMAINS.channels),
  status: createDomainClient(WAHA_DOMAINS.status),
  presence: createDomainClient(WAHA_DOMAINS.presence),
  labels: createDomainClient(WAHA_DOMAINS.labels),
  polls: createDomainClient(WAHA_DOMAINS.polls),
  calls: createDomainClient(WAHA_DOMAINS.calls),
  profile: createDomainClient(WAHA_DOMAINS.profile),
  events: createDomainClient(WAHA_DOMAINS.events),
  engines: createDomainClient(WAHA_DOMAINS.engines),
  storages: createDomainClient(WAHA_DOMAINS.storages),
  media: createDomainClient(WAHA_DOMAINS.media),
};

export { WAHA_DOMAINS } from "@/lib/waha/domains/catalog";
