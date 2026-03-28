import { siteConfig } from "@/config/site";
import { resolveAudiencePageContext } from "@/config/analytics-audiences";
import {
  GA4_EVENTS,
  hasAnalyticsConsent,
  trackAudiencePageContext,
  trackScrollDepthMilestones,
} from "@/lib/analytics";

let outboundBound = false;
let funnelBootOnce = false;

function mergePageContext(params: Record<string, unknown>): Record<string, unknown> {
  const ctx = resolveAudiencePageContext(window.location.pathname);
  return {
    funnel_stage: ctx.funnel_stage,
    page_intent: ctx.page_intent,
    ...(ctx.content_theme ? { content_theme: ctx.content_theme } : {}),
    ...params,
  };
}

function pushLayer(eventName: string, params: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...mergePageContext(params) });
}

function sendGtag(eventName: string, params: Record<string, unknown>) {
  const { ga4Id, gtmId } = siteConfig.analytics;
  if (ga4Id && !gtmId) {
    window.gtag?.("event", eventName, mergePageContext(params));
  }
}

/**
 * Cliques em links de agenda (qualquer âncora) e WhatsApp (exceto links já rastreados no React).
 */
function bindOutboundClickTracking() {
  if (outboundBound) return;
  outboundBound = true;

  const sitePhoneDigits = siteConfig.phone.replace(/\D/g, "");

  document.addEventListener(
    "click",
    (event) => {
      if (!hasAnalyticsConsent()) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a");
      if (!(link instanceof HTMLAnchorElement)) return;

      if (link.closest("[data-oft-whatsapp-tracked]")) return;

      const href = link.getAttribute("href") || "";

      if (href.includes("agenda.oftleonardo.com.br")) {
        if (link.closest("[data-oft-agenda-dialog-tracked]")) return;
        const ctaText = (link.textContent || "").trim().slice(0, 80);
        const payload = {
          channel: "online_booking" as const,
          cta_text: ctaText,
          cta_href: href,
          page_path: window.location.pathname,
          trigger_id: link.id || undefined,
          booking_channel: "online_booking" as const,
        };
        pushLayer(GA4_EVENTS.schedule_appointment, payload);
        sendGtag(GA4_EVENTS.schedule_appointment, payload);
        pushLayer(GA4_EVENTS.start_booking, payload);
        sendGtag(GA4_EVENTS.start_booking, payload);
        return;
      }

      const isWhatsAppHref =
        href.includes("api.whatsapp.com") ||
        href.includes("wa.me/") ||
        href.includes("web.whatsapp.com");
      if (!isWhatsAppHref) return;

      if (!href.includes(sitePhoneDigits)) return;

      const payload = {
        channel: "whatsapp" as const,
        page_path: window.location.pathname,
        trigger_id: link.id || undefined,
        booking_channel: "whatsapp" as const,
      };
      pushLayer(GA4_EVENTS.click_whatsapp, payload);
      sendGtag(GA4_EVENTS.click_whatsapp, payload);
      pushLayer(GA4_EVENTS.start_booking, payload);
      sendGtag(GA4_EVENTS.start_booking, payload);
    },
    true,
  );
}

/** Chamado após `enableTracking` (consentimento concedido). */
export function initOftFunnelAnalytics() {
  if (!hasAnalyticsConsent()) return;
  if (funnelBootOnce) return;
  funnelBootOnce = true;

  trackAudiencePageContext();
  trackScrollDepthMilestones();
  bindOutboundClickTracking();
}
