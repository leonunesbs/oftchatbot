import { siteConfig } from "@/config/site";
import { resolveAudiencePageContext, type AudiencePageContext } from "@/config/analytics-audiences";

export const CONSENT_STORAGE_KEY = "oftcore:consent:v1";

/** Nomes estáveis para GA4 / GTM (snake_case). */
export const GA4_EVENTS = {
  click_whatsapp: "click_whatsapp",
  schedule_appointment: "schedule_appointment",
  /** Legacy: mantido para compatibilidade com tags existentes. */
  start_booking: "start_booking",
  audience_page_context: "audience_page_context",
  scroll_depth_milestone: "scroll_depth_milestone",
} as const;

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
  const ctx = context ?? resolveAudiencePageContext(window.location.pathname);
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
}

/** Clique em agendamento online (Minha Agenda / embed). */
export function trackScheduleAppointmentClick(payload: {
  cta_text?: string;
  cta_href: string;
  page_path?: string;
  link_context?: string;
  trigger_id?: string;
}) {
  const page_path = payload.page_path ?? window.location.pathname;
  const base = {
    cta_text: payload.cta_text,
    cta_href: payload.cta_href,
    page_path,
    link_context: payload.link_context,
    trigger_id: payload.trigger_id,
    booking_channel: "online_booking" as const,
  };
  dispatch(GA4_EVENTS.schedule_appointment, base);
  dispatch(GA4_EVENTS.start_booking, {
    channel: "online_booking",
    cta_text: payload.cta_text,
    cta_href: payload.cta_href,
    page_path,
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
