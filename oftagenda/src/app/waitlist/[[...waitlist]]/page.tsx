import { Waitlist } from "@clerk/nextjs";
import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isClerkConfigured } from "@/lib/access";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function WaitlistPage() {
  if (!isClerkConfigured()) {
    return (
      <section className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Lista de espera indisponível</CardTitle>
            <CardDescription>
              Configure as variáveis do Clerk para habilitar a lista de espera.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-lg justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Lista de espera</CardTitle>
          <CardDescription>
            Cadastre seu interesse para receber o convite de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Waitlist />
        </CardContent>
      </Card>
    </section>
  );
}
