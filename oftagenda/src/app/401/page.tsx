import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "401 - Não autorizado",
  robots: {
    index: false,
    follow: false,
  },
};

type UnauthorizedPageProps = {
  searchParams?:
    | Promise<{
        from?: string;
        requiredRole?: string;
      }>
    | {
        from?: string;
        requiredRole?: string;
      };
};

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const params = (await searchParams) ?? {};
  const requiredRole = params.requiredRole === "admin" ? "admin" : "member";
  const fromPath = typeof params.from === "string" && params.from.startsWith("/") ? params.from : "/dashboard";

  return (
    <section className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-10">
      <Card className="w-full border-border/70">
        <CardHeader className="space-y-2">
          <CardTitle>401 - Não autorizado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página com o perfil atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Acesso necessário:{" "}
            <span className="font-medium text-foreground">
              {requiredRole === "admin" ? "administrador" : "membro autenticado"}
            </span>
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard">Ir para meu painel</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={fromPath}>Tentar novamente</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Voltar ao início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
