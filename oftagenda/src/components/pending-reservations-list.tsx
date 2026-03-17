"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PendingReservation = {
  _id: string;
  startsAt: number;
  holdExpiresAt: number;
  consultationType: string;
  checkoutEventType: string;
  checkoutDate: string;
  checkoutTime: string;
};

type PendingReservationsListProps = {
  reservations: PendingReservation[];
};

export function PendingReservationsList({
  reservations,
}: PendingReservationsListProps) {
  const router = useRouter();
  const [currentReservationId, setCurrentReservationId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reservationToCancelId, setReservationToCancelId] = useState<string | null>(
    null,
  );

  function handleRetryPayment(reservation: PendingReservation) {
    if (isPending) {
      return;
    }
    if (
      !reservation.checkoutEventType ||
      !reservation.checkoutDate ||
      !reservation.checkoutTime
    ) {
      setError("Não foi possível recuperar os dados deste horário para pagamento.");
      return;
    }
    setError(null);
    setCurrentReservationId(reservation._id);

    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: reservation.checkoutEventType,
            date: reservation.checkoutDate,
            time: reservation.checkoutTime,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data?.ok || typeof data.url !== "string") {
          throw new Error(data?.error ?? "Não foi possível iniciar o pagamento.");
        }
        const target = window.self !== window.top ? window.top! : window;
        target.location.href = data.url;
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Falha ao redirecionar para o pagamento.",
        );
      } finally {
        setCurrentReservationId(null);
      }
    });
  }

  function handleCancelReservationRequest(reservationId: string) {
    if (isPending) {
      return;
    }
    setReservationToCancelId(reservationId);
  }

  function handleConfirmCancelReservation() {
    if (isPending || !reservationToCancelId) {
      return;
    }

    setError(null);
    setCurrentReservationId(reservationToCancelId);
    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/reservations/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: reservationToCancelId }),
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error ?? "Não foi possível cancelar o agendamento.");
        }
        router.refresh();
      } catch (cancelError) {
        setError(
          cancelError instanceof Error
            ? cancelError.message
            : "Falha ao cancelar o agendamento.",
        );
      } finally {
        setReservationToCancelId(null);
        setCurrentReservationId(null);
      }
    });
  }

  if (reservations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum agendamento pendente de pagamento no momento.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {reservations.map((item) => {
          const isCurrentAction = isPending && currentReservationId === item._id;
          const canRetryPayment = Boolean(
            item.checkoutEventType && item.checkoutDate && item.checkoutTime,
          );
          return (
            <li
              key={item._id}
              className="space-y-2 rounded-lg border border-border/70 p-3"
            >
              <p className="text-sm text-muted-foreground">
                {item.consultationType} -{" "}
                {new Date(item.startsAt).toLocaleString("pt-BR")} (reservado até{" "}
                {new Date(item.holdExpiresAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                )
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending || !canRetryPayment}
                  onClick={() => handleRetryPayment(item)}
                >
                  {isCurrentAction ? "Processando..." : "Tentar pagamento"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleCancelReservationRequest(item._id)}
                >
                  {isCurrentAction ? "Cancelando..." : "Cancelar agendamento"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <AlertDialog
        open={reservationToCancelId !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setReservationToCancelId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente cancelar este agendamento pendente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Voltar</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={handleConfirmCancelReservation}>
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
