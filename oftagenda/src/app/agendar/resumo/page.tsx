import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { StartCheckoutButton } from "@/components/start-checkout-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { resolvePreBookingSummary } from "@/lib/pre-booking-summary";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

type ResumoPageProps = {
  searchParams?:
    | Promise<{
        locationId?: string;
        location?: string;
        date?: string;
        time?: string;
        payment?: string;
      }>
    | {
        locationId?: string;
        location?: string;
        date?: string;
        time?: string;
        payment?: string;
      };
};

export default async function ResumoPreAgendamentoPage({
  searchParams,
}: ResumoPageProps) {
  const params = (await searchParams) ?? {};
  const [summary, { userId }] = await Promise.all([
    resolvePreBookingSummary(params),
    auth(),
  ]);
  const checkoutNotCompleted = summary.payment === "cancelled";
  const hasErrorState =
    summary.hasRedactedParams ||
    (summary.hasInvalidSelection && !checkoutNotCompleted);

  if (hasErrorState) {
    return (
      <section className="mx-auto w-full max-w-3xl">
        <Card className="border-destructive/40 bg-card/95 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle>Erro ao carregar agendamento</CardTitle>
            <CardDescription>
              {summary.hasRedactedParams
                ? "Detectamos dados inválidos na URL deste pré-agendamento. Por segurança, inicie um novo agendamento."
                : "Esse horário não está mais disponível para o local selecionado. Escolha um novo horário para continuar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/agendar">Fazer novo agendamento</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }
  const addressHref = summary.locationAddress
    ? buildAddressHref(summary.locationAddress)
    : "";
  const remainingAtConsultationCents = Math.max(
    summary.consultationPriceCents - summary.reservationFeeCents,
    0,
  );

  return (
    <section className="mx-auto flex min-h-[55vh] w-full max-w-4xl items-center">
      <Card className="w-full border-border/60 bg-card/90 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Resumo do pré-agendamento
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground/90">
            {summary.paymentMode === "in_person"
              ? "Confira os dados antes de confirmar o agendamento."
              : summary.paymentMode === "full_payment"
                ? "Confira os dados antes de confirmar seu horário com pagamento online."
                : "Confira os dados antes de seguir para a confirmação online do horário."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {checkoutNotCompleted ? (
            <Alert variant="destructive">
              <AlertTitle>Pagamento não concluído</AlertTitle>
              <AlertDescription>
                Seu pagamento não foi concluído. Se desejar
                confirmar este horário, você pode tentar
                novamente abaixo.
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="rounded-xl border border-border/60 bg-muted/15 p-4 text-xs text-muted-foreground sm:text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <p>
                <span className="font-semibold text-foreground/90">Local:</span>{" "}
                {summary.locationLabel}
              </p>
              {summary.locationAddress ? (
                <p>
                  <span className="font-semibold text-foreground/90">Endereço:</span>{" "}
                  <a
                    href={addressHref}
                    className="underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Abrir o endereço em um aplicativo de mapas: ${summary.locationAddress}`}
                  >
                    {summary.locationAddress}
                  </a>
                </p>
              ) : null}
              <p>
                <span className="font-semibold text-foreground/90">Data:</span>{" "}
                {summary.dateLabel}
              </p>
              <p>
                <span className="font-semibold text-foreground/90">Horário:</span>{" "}
                {summary.timeLabel}
              </p>
            </div>
          </div>

          {summary.paymentMode === "in_person" ? (
            <div className="rounded-xl border border-border/60 bg-muted/15 p-4 text-sm">
              <p className="text-sm font-semibold text-foreground/90">
                Pagamento presencial
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                O pagamento será realizado presencialmente no dia da consulta.
              </p>
              {summary.consultationPriceCents > 0 ? (
                <div className="mt-3 rounded-lg border border-border/60 bg-background/60 p-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground/90">
                      Consulta oftalmológica
                    </p>
                    <p className="text-sm font-semibold text-foreground/90">
                      {formatConsultationPrice(summary.consultationPriceCents)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Valor a ser pago presencialmente no dia da consulta.
                  </p>
                </div>
              ) : null}
            </div>
          ) : summary.paymentMode === "full_payment" ? (
            <div className="rounded-xl border border-border/60 bg-muted/15 p-4 text-sm">
              <p className="text-sm font-semibold text-foreground/90">
                Resumo financeiro
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Para confirmar este horário, o investimento da consulta é feito online neste momento.
              </p>
              <div className="mt-3 rounded-lg border border-border/60 bg-background/60 p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground/90">
                    Investimento da consulta
                  </p>
                  <p className="text-sm font-medium text-foreground/90">
                    {formatConsultationPrice(summary.consultationPriceCents)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Valor pago online para finalizar a confirmação.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/15 p-4 text-sm">
              <p className="text-sm font-semibold text-foreground/90">
                Resumo financeiro
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Você confirma o horário com uma entrada online e acerta o restante no dia da consulta.
              </p>
              <div className="mt-3 space-y-3 rounded-lg border border-border/60 bg-background/60 p-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Entrada para confirmação
                    </p>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {formatReservationFee(summary.reservationFeeCents)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor online para garantir este horário.
                  </p>
                </div>
                <div className="h-px w-full bg-border/70" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Restante no dia da consulta
                    </p>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      {formatRemainingAtConsultation(
                        summary.consultationPriceCents,
                        remainingAtConsultationCents,
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ajuste presencial no atendimento.
                  </p>
                </div>
                <div className="h-px w-full bg-border/70" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-foreground/90">
                      Investimento total
                    </p>
                    <p className="text-sm font-medium text-foreground/90">
                      {formatConsultationPrice(summary.consultationPriceCents)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor completo da consulta.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex w-full flex-col gap-2 border-t border-border/70 pt-3">
            <StartCheckoutButton
              location={summary.locationId}
              date={summary.date}
              time={summary.time}
              secondaryAction={
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/agendar">Editar agendamento</Link>
                </Button>
              }
              label={
                summary.paymentMode === "in_person"
                  ? "Confirmar agendamento"
                  : summary.paymentMode === "full_payment"
                    ? "Confirmar com pagamento online"
                    : "Confirmar horário"
              }
              isAuthenticated={Boolean(userId)}
              paymentMode={summary.paymentMode}
              reservationAmountCents={summary.reservationFeeCents}
              consultationAmountCents={summary.consultationPriceCents}
              reservationFeePercent={summary.reservationFeePercent}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function buildAddressHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function formatReservationFee(cents: number) {
  if (cents <= 0) {
    return "Cobrada no checkout de confirmação.";
  }

  return formatMoney(cents);
}

function formatConsultationPrice(cents: number) {
  if (cents <= 0) {
    return "A confirmar";
  }

  return formatMoney(cents);
}

function formatRemainingAtConsultation(totalCents: number, remainingCents: number) {
  if (totalCents <= 0) {
    return "A confirmar";
  }

  return formatMoney(remainingCents);
}
