"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { StartCheckoutButton } from "@/components/start-checkout-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";

import type { PaymentMode } from "@/lib/booking-bootstrap";
import {
  closeParallelRoute,
  useParallelRouteBackHref,
} from "@/lib/parallel-route-navigation";

type ResumoDialogProps = {
  eventType: string;
  eventTypeLabel: string;
  eventTypeAddress: string;
  consultationPriceCents: number;
  reservationFeeCents: number;
  reservationFeePercent: number;
  paymentMode?: PaymentMode;
  date: string;
  dateLabel: string;
  time: string;
  timeLabel: string;
  payment: string;
  hasRedactedParams: boolean;
  hasInvalidSelection: boolean;
  isAuthenticated: boolean;
};

export function ResumoDialog({
  eventType,
  eventTypeLabel,
  eventTypeAddress,
  consultationPriceCents,
  reservationFeeCents,
  reservationFeePercent,
  paymentMode = "booking_fee",
  date,
  dateLabel,
  time,
  timeLabel,
  payment,
  hasRedactedParams,
  hasInvalidSelection,
  isAuthenticated,
}: ResumoDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const backHref = useParallelRouteBackHref("/agendar");
  const [isOpen, setIsOpen] = useState(true);
  const closeRequestedRef = useRef(false);
  const checkoutNotCompleted = payment === "cancelled";
  const hasError = hasRedactedParams || hasInvalidSelection;
  const addressHref = eventTypeAddress ? buildAddressHref(eventTypeAddress) : "";
  const remainingAtConsultationCents = Math.max(
    consultationPriceCents - reservationFeeCents,
    0,
  );
  const handleCloseDialog = useCallback(() => {
    if (closeRequestedRef.current) {
      return;
    }
    closeRequestedRef.current = true;
    setIsOpen(false);

    window.setTimeout(() => {
      closeParallelRoute(router, "/agendar", backHref);
    }, 120);
  }, [backHref, router]);

  useEffect(() => {
    const backPath = backHref.split("?")[0]?.split("#")[0] ?? backHref;
    if (pathname !== backPath) {
      closeRequestedRef.current = false;
      setIsOpen(true);
    }
  }, [backHref, pathname]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        }
      }}
    >
      <DialogContent showCloseButton={false}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-4 right-4"
          onClick={handleCloseDialog}
          aria-label="Fechar resumo"
        >
          <XIcon />
        </Button>
        <DialogHeader>
          <DialogTitle>
            {hasError
              ? "Erro ao carregar agendamento"
              : "Resumo do agendamento"}
          </DialogTitle>
          <DialogDescription>
            {hasRedactedParams
              ? "Detectamos dados inválidos na URL. Por segurança, inicie um novo agendamento."
              : checkoutNotCompleted
                ? "Você não concluiu o checkout. Esse horário foi liberado e pode já ter sido ocupado. Escolha um novo horário."
                : hasInvalidSelection
                  ? "Esse horário não está mais disponível para o evento selecionado. Escolha um novo horário."
                  : paymentMode === "in_person"
                    ? "Confira os dados antes de confirmar o agendamento."
                    : paymentMode === "full_payment"
                      ? "Confira os dados antes de confirmar seu horário com pagamento online."
                      : "Confira os dados selecionados antes de seguir para a confirmação online do horário."}
          </DialogDescription>
        </DialogHeader>

        {hasError ? (
          <p className="text-sm text-destructive">
            {hasRedactedParams
              ? "Não foi possível validar os dados deste resumo."
              : checkoutNotCompleted
                ? "Você saiu do checkout sem concluir o pagamento da confirmação online. Inicie um novo agendamento para escolher outro horário."
                : "Não foi possível validar os dados deste resumo."}
          </p>
        ) : (
          <div className="rounded-xl border border-border/60 bg-muted/15 p-4 text-xs text-muted-foreground sm:text-sm">
            <p>
              <span className="font-semibold text-foreground/90">Evento:</span>{" "}
              {eventTypeLabel}
            </p>
            {eventTypeAddress ? (
              <p>
                <span className="font-semibold text-foreground/90">Endereço:</span>{" "}
                <a
                  href={addressHref}
                  className="underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`Abrir o endereço em um aplicativo de mapas: ${eventTypeAddress}`}
                >
                  {eventTypeAddress}
                </a>
              </p>
            ) : null}
            <p>
              <span className="font-semibold text-foreground/90">Data:</span>{" "}
              {dateLabel}
            </p>
            <p>
              <span className="font-semibold text-foreground/90">Horário:</span>{" "}
              {timeLabel}
            </p>
            {paymentMode === "in_person" ? (
              <>
                <p className="mt-2 text-sm font-semibold text-foreground/90">
                  Pagamento presencial
                </p>
                <p className="text-xs text-muted-foreground">
                  O pagamento será realizado presencialmente no dia da consulta.
                </p>
                {consultationPriceCents > 0 ? (
                  <div className="mt-2 rounded-lg border border-border/60 bg-background/60 p-2.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <p className="text-sm font-semibold text-foreground/90">
                        Consulta oftalmológica
                      </p>
                    <p className="text-sm font-semibold text-foreground/90 sm:text-right">
                        {formatConsultationPrice(consultationPriceCents)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Valor a ser pago presencialmente.
                    </p>
                  </div>
                ) : null}
              </>
            ) : paymentMode === "full_payment" ? (
              <>
                <p className="mt-2 text-sm font-semibold text-foreground/90">
                  Resumo financeiro
                </p>
                <p className="text-xs text-muted-foreground">
                  Para confirmar este horário, o investimento da consulta é feito online neste momento.
                </p>
                <div className="mt-2 rounded-lg border border-border/60 bg-background/60 p-2.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className="text-sm text-foreground/90">
                      Investimento da consulta
                    </p>
                    <p className="text-sm font-medium text-foreground/90 sm:text-right">
                      {formatConsultationPrice(consultationPriceCents)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Valor pago online para finalizar a confirmação.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-semibold text-foreground/90">
                  Resumo financeiro
                </p>
                <p className="text-xs text-muted-foreground">
                  Você confirma o horário com uma entrada online e acerta o restante no dia da consulta.
                </p>
                <div className="mt-2 space-y-3 rounded-lg border border-border/60 bg-background/60 p-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">
                        Entrada para confirmação
                      </p>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 sm:text-right">
                        {formatReservationFee(reservationFeeCents)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor online para garantir este horário.
                    </p>
                  </div>
                  <div className="h-px w-full bg-border/70" />
                  <div className="space-y-1">
                    <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-4">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground/90">
                          Restante no dia da consulta
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ajuste presencial no atendimento.
                        </p>
                      </div>
                      <div className="space-y-0.5 sm:text-right">
                        <p className="text-sm font-medium text-foreground/90">
                          {formatRemainingInstallment(
                            consultationPriceCents,
                            remainingAtConsultationCents,
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total{" "}
                          {formatRemainingAtConsultationTotal(
                            consultationPriceCents,
                            remainingAtConsultationCents,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {checkoutNotCompleted ? (
              <p className="mt-2 text-destructive">
                Você saiu do checkout sem concluir o pagamento.
                Para confirmar o horário, inicie uma nova
                tentativa.
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {hasError ? (
            <Button type="button" onClick={() => router.push("/agendar")}>
              Fazer novo agendamento
            </Button>
          ) : (
            <StartCheckoutButton
              eventType={eventType}
              date={date}
              time={time}
              secondaryAction={
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="w-full sm:w-auto"
                >
                  Editar agendamento
                </Button>
              }
              label={
                paymentMode === "in_person"
                  ? "Confirmar agendamento"
                  : paymentMode === "full_payment"
                      ? "Confirmar com pagamento online"
                    : "Confirmar horário"
              }
              isAuthenticated={isAuthenticated}
              paymentMode={paymentMode}
              reservationAmountCents={reservationFeeCents}
              consultationAmountCents={consultationPriceCents}
              reservationFeePercent={reservationFeePercent}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function formatRemainingInstallment(totalCents: number, remainingCents: number) {
  if (totalCents <= 0) {
    return "A confirmar";
  }

  if (remainingCents <= 0) {
    return formatMoney(0);
  }

  const maxInstallmentCents = 9_999;
  const installments = Math.max(1, Math.ceil(remainingCents / maxInstallmentCents));
  const installmentCents = Math.floor(remainingCents / installments);

  return `${installments}x de ${formatMoney(installmentCents)}`;
}

function formatRemainingAtConsultationTotal(
  totalCents: number,
  remainingCents: number,
) {
  if (totalCents <= 0) {
    return "A confirmar";
  }

  return formatMoney(Math.max(remainingCents, 0));
}
