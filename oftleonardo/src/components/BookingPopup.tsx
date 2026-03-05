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
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
      aria-label={triggerAriaLabel}
    >
      <a href={siteConfig.partnerApps.oftagenda}>{children}</a>
    </Button>
  );
}
