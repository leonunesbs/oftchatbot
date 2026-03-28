/**
 * Contrato compartilhado de eventos GTM: manter idêntico a `oftagenda/src/lib/oft-analytics-events.ts`
 * (o split por subtree não inclui pacotes fora de cada app).
 */

/**
 * Nomes estáveis no `dataLayer` para um único container GTM em oftleonardo.com.br e agenda.oftleonardo.com.br.
 * Configure o mesmo ID em `PUBLIC_GTM_ID` (Astro) e `NEXT_PUBLIC_GTM_ID` (Next).
 */
export const OFT_ANALYTICS_EVENTS = {
  /** oftagenda: escolha do tipo de evento / local. */
  select_city: "select_city",
  /** Início do funil de agendamento (site + agenda). */
  start_booking: "start_booking",
  /** oftagenda: confirmação / checkout. */
  submit_booking: "submit_booking",
  /** oftagenda: agendamento concluído. */
  booking_confirmed: "booking_confirmed",
  /** Clique medindo atribuição entre domínios (GTM). */
  cross_domain_click: "cross_domain_click",

  click_whatsapp: "click_whatsapp",
  schedule_appointment: "schedule_appointment",
  booking_dialog_open: "booking_dialog_open",
  /** Conversão no GA4 (WhatsApp ou agendar online no diálogo). */
  generate_lead: "generate_lead",
  /** oftleonardo: contexto de página para públicos. */
  audience_page_context: "audience_page_context",
  scroll_depth_milestone: "scroll_depth_milestone",
} as const;

export type OftAnalyticsEventName = (typeof OFT_ANALYTICS_EVENTS)[keyof typeof OFT_ANALYTICS_EVENTS];

export const OFTAGENDA_ANALYTICS_EVENTS = [
  OFT_ANALYTICS_EVENTS.select_city,
  OFT_ANALYTICS_EVENTS.start_booking,
  OFT_ANALYTICS_EVENTS.submit_booking,
  OFT_ANALYTICS_EVENTS.booking_confirmed,
  OFT_ANALYTICS_EVENTS.cross_domain_click,
] as const;

export type OftAgendaAnalyticsEventName = (typeof OFTAGENDA_ANALYTICS_EVENTS)[number];

/** Identifica a origem no mesmo container GTM (filtros e dimensões). */
export const ANALYTICS_APP = {
  oftleonardo: "oftleonardo",
  oftagenda: "oftagenda",
} as const;
