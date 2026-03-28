import WhatsAppModal from "./WhatsAppModal";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  triggerAriaLabel?: string;
  triggerId?: string;
  onlineBookingLinkId?: string;
  /** Deep link `?agendar=1` + sincronização de URL (CTA principal da home). */
  urlSync?: boolean;
}

export default function BookingPopup({
  children,
  variant = "default",
  size = "default",
  className,
  triggerAriaLabel,
  triggerId,
  onlineBookingLinkId,
  urlSync,
}: Props) {
  return (
    <WhatsAppModal
      variant={variant}
      size={size}
      className={className}
      triggerAriaLabel={triggerAriaLabel}
      triggerId={triggerId}
      onlineBookingLinkId={onlineBookingLinkId}
      urlSync={urlSync}
    >
      {children}
    </WhatsAppModal>
  );
}
