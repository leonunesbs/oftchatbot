import { siteConfig } from "@/config/site";
import { resolveAudiencePageContext, type AudiencePageContext } from "@/config/analytics-audiences";

export const CONSENT_STORAGE_KEY = "oftcore:consent:v1";

/** Nomes estáveis para GA4 / GTM (snake_case). */
export const GA4_EVENTS = {
  click_whatsapp: "click_whatsapp",
  schedule_appointment: "schedule_appointment",
  /** Abertura do diálogo de agendamento (CTA que não é link; GTM pode mapear por `dialog_opener_id`). */
  booking_dialog_open: "booking_dialog_open",
  /** Clique em cidade (WhatsApp) ou em “Agendar online” no diálogo de agendamento. Marque como conversão no GA4. */
  generate_lead: "generate_lead",
  /** Legacy: mantido para compatibilidade com tags existentes. */
  start_booking: "start_booking",
  audience_page_context: "audience_page_context",
  scroll_depth_milestone: "scroll_depth_milestone",
} as const;

const FLOAT_ENTRY_BY_TRIGGER: Record<
  string,
  "float_whatsapp" | "float_booking"
> = {
  "gtm-float-whatsapp": "float_whatsapp",
  "gtm-float-booking-calendar": "float_booking",
  "gtm-float-whatsapp-dialog-agendar-online": "float_whatsapp",
  "gtm-float-booking-dialog-agendar-online": "float_booking",
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === "granted";
  } catch {
    return false;
  }
}

function mergeContext(
  params: Record<string, unknown>,
  context?: AudiencePageContext,
): Record<string, unknown> {
  const ctx =
    context ??
    resolveAudiencePageContext(
      typeof window !== "undefined" ? window.location.pathname : "/",
      typeof window !== "undefined" ? window.location.search : undefined,
    );
  return {
    funnel_stage: ctx.funnel_stage,
    page_intent: ctx.page_intent,
    ...(ctx.content_theme ? { content_theme: ctx.content_theme } : {}),
    ...params,
  };
}

function pushToDataLayer(eventName: string, params: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
}

function sendGtag(eventName: string, params: Record<string, unknown>) {
  const { ga4Id, gtmId } = siteConfig.analytics;
  if (ga4Id && !gtmId) {
    window.gtag?.("event", eventName, params);
  }
}

function dispatch(eventName: string, params: Record<string, unknown>) {
  if (!hasAnalyticsConsent()) return;
  const merged = mergeContext(params);
  pushToDataLayer(eventName, merged);
  sendGtag(eventName, merged);
}

function resolveFloatEntry(
  dialog_opener_id?: string,
  online_link_id?: string,
): "float_whatsapp" | "float_booking" | undefined {
  if (dialog_opener_id && FLOAT_ENTRY_BY_TRIGGER[dialog_opener_id]) {
    return FLOAT_ENTRY_BY_TRIGGER[dialog_opener_id];
  }
  if (online_link_id && FLOAT_ENTRY_BY_TRIGGER[online_link_id]) {
    return FLOAT_ENTRY_BY_TRIGGER[online_link_id];
  }
  return undefined;
}

/**
 * `generate_lead` ao escolher cidade (WhatsApp) ou “Agendar online” no diálogo (`WhatsAppModal`).
 * Parâmetro `float_entry` só quando o disparo vem dos flutuantes (ids conhecidos).
 */
export function dispatchBookingDialogGenerateLead(payload: {
  method: "whatsapp" | "online_booking";
  /** id do botão que abre o diálogo (ex.: gtm-float-whatsapp). */
  dialog_opener_id?: string;
  city?: string;
  cta_href?: string;
  /** id do link “Agendar online” (ex.: gtm-float-whatsapp-dialog-agendar-online). */
  online_link_id?: string;
}) {
  const float_entry = resolveFloatEntry(
    payload.dialog_opener_id,
    payload.online_link_id,
  );
  dispatch(GA4_EVENTS.generate_lead, {
    booking_method: payload.method,
    booking_conversion_scope: "booking_dialog",
    ...(payload.dialog_opener_id ? { dialog_opener_id: payload.dialog_opener_id } : {}),
    ...(payload.online_link_id ? { online_link_id: payload.online_link_id } : {}),
    ...(payload.city ? { city: payload.city } : {}),
    ...(payload.cta_href ? { cta_href: payload.cta_href } : {}),
    ...(float_entry ? { float_entry } : {}),
    page_path: window.location.pathname,
  });
}

/** Clique que abre WhatsApp (api.whatsapp.com / wa.me). */
export function trackClickWhatsapp(payload: {
  city?: string;
  page_path?: string;
  trigger_id?: string;
  channel_detail?: string;
}) {
  const page_path = payload.page_path ?? window.location.pathname;
  const base = {
    ...payload,
    page_path,
    booking_channel: "whatsapp" as const,
  };
  dispatch(GA4_EVENTS.click_whatsapp, base);
  dispatch(GA4_EVENTS.start_booking, {
    channel: "whatsapp",
    city: payload.city,
    page_path,
    trigger_id: payload.trigger_id,
  });
  dispatchBookingDialogGenerateLead({
    method: "whatsapp",
    dialog_opener_id: payload.trigger_id,
    city: payload.city,
  });
}

/** Diálogo de agendamento aberto (botão CTA ou deep link `?agendar=1`). */
export function trackBookingDialogOpen(payload: {
  /** `id` do botão que abre o diálogo (GTM). Deep link: `gtm-url-deeplink-agendar`. */
  dialog_opener_id?: string;
  /** Texto visível do CTA, quando for string simples. */
  cta_text?: string;
  page_path?: string;
  /** URL completa (útil quando há query, ex.: `?agendar=1`). */
  page_location?: string;
  /** Disparo via URL em vez de clique no CTA. */
  booking_entry?: "url_deeplink";
}) {
  const page_path = payload.page_path ?? window.location.pathname;
  const float_entry = resolveFloatEntry(payload.dialog_opener_id);
  dispatch(GA4_EVENTS.booking_dialog_open, {
    ...payload,
    page_path,
    booking_conversion_scope: "booking_dialog",
    ...(float_entry ? { float_entry } : {}),
  });
}

/** Clique em agendamento online (Minha Agenda em agenda.oftleonardo.com.br). */
export function trackScheduleAppointmentClick(payload: {
  cta_text?: string;
  cta_href: string;
  page_path?: string;
  link_context?: string;
  /** `id` do link (GTM). */
  trigger_id?: string;
  /** `id` do botão que abriu o diálogo de agendamento. */
  dialog_opener_id?: string;
}) {
  const page_path = payload.page_path ?? window.location.pathname;
  const base = {
    cta_text: payload.cta_text,
    cta_href: payload.cta_href,
    page_path,
    link_context: payload.link_context,
    trigger_id: payload.trigger_id,
    dialog_opener_id: payload.dialog_opener_id,
    booking_channel: "online_booking" as const,
  };
  dispatch(GA4_EVENTS.schedule_appointment, base);
  dispatch(GA4_EVENTS.start_booking, {
    channel: "online_booking",
    cta_text: payload.cta_text,
    cta_href: payload.cta_href,
    page_path,
  });
  dispatchBookingDialogGenerateLead({
    method: "online_booking",
    dialog_opener_id: payload.dialog_opener_id,
    online_link_id: payload.trigger_id,
    cta_href: payload.cta_href,
  });
}

/** Contexto da página para públicos (uma vez por carregamento, após consentimento). */
export function trackAudiencePageContext() {
  if (!hasAnalyticsConsent()) return;
  dispatch(GA4_EVENTS.audience_page_context, {
    page_path: window.location.pathname,
    page_location: window.location.href,
  });
}

let scrollDepthBound = false;

/** Marcos 50% e 75% de rolagem para públicos de engajamento. */
export function trackScrollDepthMilestones() {
  if (scrollDepthBound || typeof document === "undefined") return;
  scrollDepthBound = true;

  const sent = new Set<number>();

  function check() {
    if (!hasAnalyticsConsent()) return;
    const docEl = document.documentElement;
    const scrollTop = window.scrollY ?? docEl.scrollTop;
    const clientHeight = window.innerHeight;
    const scrollHeight = docEl.scrollHeight;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) return;
    const pct = Math.round((scrollTop / maxScroll) * 100);
    for (const mark of [50, 75]) {
      if (pct >= mark && !sent.has(mark)) {
        sent.add(mark);
        dispatch(GA4_EVENTS.scroll_depth_milestone, {
          percent_scrolled: mark,
          page_path: window.location.pathname,
        });
      }
    }
  }

  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check, { passive: true });
  check();
}
