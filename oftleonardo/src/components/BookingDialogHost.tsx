"use client";

import { BookingDialogPanel } from "@/components/booking-dialog-panel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trackBookingDialogOpen } from "@/lib/analytics";
import { isBookingUrlOpen, setBookingUrlParam } from "@/lib/booking-url";
import { useEffect, useRef, useState } from "react";

const GTM_DEEPLINK_OPENER_ID = "gtm-url-deeplink-agendar";

type SessionMeta = {
  triggerId?: string;
  onlineBookingLinkId: string;
  urlSync: boolean;
  ctaText?: string;
};

export default function BookingDialogHost() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionMeta | null>(null);
  const sessionRef = useRef<SessionMeta | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/") return;
    if (!isBookingUrlOpen()) return;

    const meta: SessionMeta = {
      triggerId: GTM_DEEPLINK_OPENER_ID,
      onlineBookingLinkId: "gtm-hero-dialog-agendar-online",
      urlSync: true,
      ctaText: "Agendar Consulta",
    };
    sessionRef.current = meta;
    setSession(meta);
    setOpen(true);
    trackBookingDialogOpen({
      dialog_opener_id: GTM_DEEPLINK_OPENER_ID,
      cta_text: "Agendar Consulta",
      page_path: window.location.pathname,
      page_location: window.location.href,
      booking_entry: "url_deeplink",
    });
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const node = e.target;
      const base =
        node instanceof Element ? node : node instanceof Text ? node.parentElement : null;
      const el = base?.closest<HTMLElement>("[data-booking-trigger]");
      if (!el) return;
      e.preventDefault();

      const triggerId = el.id || el.dataset.triggerId || undefined;
      const onlineBookingLinkId =
        el.dataset.onlineBookingLinkId ?? "gtm-dialog-agendar-online";
      const urlSync = el.dataset.urlSync === "true";
      const ctaText =
        el.dataset.bookingCta?.trim() ||
        el.textContent?.trim().slice(0, 120) ||
        undefined;

      const meta: SessionMeta = {
        triggerId,
        onlineBookingLinkId,
        urlSync,
        ctaText,
      };
      sessionRef.current = meta;
      setSession(meta);
      setOpen(true);

      trackBookingDialogOpen({
        dialog_opener_id: triggerId,
        cta_text: ctaText,
        page_path: window.location.pathname,
        page_location: window.location.href,
      });
    }

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    const meta = sessionRef.current;
    if (meta?.urlSync) {
      setBookingUrlParam(next);
    }
    if (!next) {
      sessionRef.current = null;
      setSession(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(90dvh,calc(100vh-2rem))] overflow-y-auto overflow-x-hidden overscroll-y-contain sm:max-w-md">
        {session ? (
          <BookingDialogPanel
            triggerId={session.triggerId}
            onlineBookingLinkId={session.onlineBookingLinkId}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
