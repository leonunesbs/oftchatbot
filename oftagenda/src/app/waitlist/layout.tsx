import type { ReactNode } from "react";
import { ptBR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";

type WaitlistLayoutProps = {
  children: ReactNode;
};

export default function WaitlistLayout({ children }: WaitlistLayoutProps) {
  return (
    <ClerkProvider localization={ptBR} waitlistUrl="/waitlist">
      {children}
    </ClerkProvider>
  );
}
