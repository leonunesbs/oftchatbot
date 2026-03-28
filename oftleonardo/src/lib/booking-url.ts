/** Query usada para abrir o diálogo de agendamento (deep link + sincronização com URL). */
export const BOOKING_QUERY_PARAM = "agendar";
export const BOOKING_QUERY_VALUE = "1";

export function isBookingUrlOpen(search?: string): boolean {
  if (typeof window === "undefined") return false;
  const q = search ?? window.location.search;
  return new URLSearchParams(q).get(BOOKING_QUERY_PARAM) === BOOKING_QUERY_VALUE;
}

/** Atualiza a URL sem recarregar (replaceState). */
export function setBookingUrlParam(show: boolean): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (show) {
    url.searchParams.set(BOOKING_QUERY_PARAM, BOOKING_QUERY_VALUE);
  } else {
    url.searchParams.delete(BOOKING_QUERY_PARAM);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, "", next);
}
