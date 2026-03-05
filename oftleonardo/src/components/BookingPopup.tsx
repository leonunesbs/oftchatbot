import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  triggerAriaLabel?: string;
}

export default function BookingPopup({
  children,
  variant = "default",
  size = "default",
  className,
  triggerAriaLabel,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label={triggerAriaLabel}
        >
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogTitle className="sr-only">Agendamento Online</DialogTitle>
        <iframe
          src={siteConfig.partnerApps.oftagendaEmbed}
          width="100%"
          style={{ height: "600px", border: 0 }}
          allow="payment"
          title="Agendamento de consulta oftalmológica"
        />
      </DialogContent>
    </Dialog>
  );
}
