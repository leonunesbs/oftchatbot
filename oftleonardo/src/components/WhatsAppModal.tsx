import { BookingDialogPanel } from "@/components/booking-dialog-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  trackBookingDialogOpen,
} from "@/lib/analytics";
import { isBookingUrlOpen, setBookingUrlParam } from "@/lib/booking-url";
import { useEffect, useRef, useState, type ReactNode } from "react";

const GTM_DEEPLINK_OPENER_ID = "gtm-url-deeplink-agendar";

function ctaTextFromChildren(children: ReactNode): string | undefined {
  if (typeof children === "string") return children.trim().slice(0, 120);
  if (typeof children === "number") return String(children).slice(0, 120);
  return undefined;
}

interface Props {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  /** Stable `id` for GTM/GA4 (variável "ID do clique"). */
  triggerId?: string;
  /** `id` no link "Agendar online" dentro do diálogo. */
  onlineBookingLinkId?: string;
  triggerAriaLabel?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  whatsappMessageTemplate?: string;
  showOnlineBookingCta?: boolean;
  /**
   * Lê `?agendar=1`, abre o diálogo e sincroniza a URL ao fechar (use só no CTA principal da home).
   */
  urlSync?: boolean;
}

export default function WhatsAppModal({
  children,
  variant = "default",
  size = "default",
  className,
  triggerId,
  onlineBookingLinkId = "gtm-dialog-agendar-online",
  triggerAriaLabel,
  dialogTitle = "Agendar Consulta",
  dialogDescription = "Escolha a cidade e inicie o agendamento pelo WhatsApp",
  whatsappMessageTemplate = "Olá, Dr. Leonardo! Gostaria de agendar uma consulta oftalmológica em {city}.",
  showOnlineBookingCta = true,
  urlSync = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const deeplinkSyncRef = useRef(false);

  useEffect(() => {
    if (!urlSync) return;
    if (!isBookingUrlOpen()) return;
    deeplinkSyncRef.current = true;
    setOpen(true);
    trackBookingDialogOpen({
      dialog_opener_id: GTM_DEEPLINK_OPENER_ID,
      cta_text: ctaTextFromChildren(children),
      page_path: window.location.pathname,
      page_location: window.location.href,
      booking_entry: "url_deeplink",
    });
  }, [urlSync]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (urlSync) {
      setBookingUrlParam(next);
    }
    if (!next) return;
    if (deeplinkSyncRef.current) {
      deeplinkSyncRef.current = false;
      return;
    }
    trackBookingDialogOpen({
      dialog_opener_id: triggerId,
      cta_text: ctaTextFromChildren(children),
      page_path:
        typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label={triggerAriaLabel}
          {...(triggerId ? { id: triggerId } : {})}
        >
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90dvh,calc(100vh-2rem))] overflow-y-auto overflow-x-hidden overscroll-y-contain sm:max-w-md">
        <BookingDialogPanel
          triggerId={triggerId}
          onlineBookingLinkId={onlineBookingLinkId}
          dialogTitle={dialogTitle}
          dialogDescription={dialogDescription}
          whatsappMessageTemplate={whatsappMessageTemplate}
          showOnlineBookingCta={showOnlineBookingCta}
        />
      </DialogContent>
    </Dialog>
  );
}
