"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { cn } from "@/lib/utils";
import type { LocationAvailabilityDate } from "@/lib/booking-bootstrap";

type ReschedulePolicy = {
  canReschedule: boolean;
  canCancel: boolean;
  isClinicInitiatedReschedule: boolean;
  cancelReason: string | null;
  requiresHumanSupport: boolean;
  reason: string | null;
  maxReschedules: number;
  reschedulesUsed: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  requiresPaidReschedule?: boolean;
  paidRescheduleAmountCents?: number | null;
};

type RescheduleAppointmentCardProps = {
  policy: ReschedulePolicy;
  fixedEventType: {
    id: string;
    label: string;
  };
  fixedLocation: {
    value: string;
    label: string;
  };
  dateOptions: LocationAvailabilityDate[];
  availabilityError?: string;
  displayMode?: "card" | "embedded";
  paymentStatus?: string;
  initialDate?: string;
  initialTime?: string;
  onCompleted?: () => void;
};

export function RescheduleAppointmentCard({
  policy,
  fixedEventType,
  fixedLocation,
  dateOptions,
  availabilityError,
  displayMode = "card",
  paymentStatus,
  initialDate = "",
  initialTime = "",
  onCompleted,
}: RescheduleAppointmentCardProps) {
  const router = useRouter();
  const initialDateFromQuery = dateOptions.some((item) => item.isoDate === initialDate)
    ? initialDate
    : "";
  const [selectedDate, setSelectedDate] = useState(initialDateFromQuery);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [timesByDate, setTimesByDate] = useState<Record<string, string[]>>({});
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [timeLoadError, setTimeLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [hasAcceptedPolicy, setHasAcceptedPolicy] = useState(false);

  const selectedDateOption =
    dateOptions.find((item) => item.isoDate === selectedDate) ?? null;
  const timeOptions = selectedDate ? (timesByDate[selectedDate] ?? selectedDateOption?.times ?? []) : [];
  const canSubmit = Boolean(policy.canReschedule && selectedDate && selectedTime && hasAcceptedPolicy);
  const canCancel = Boolean(policy.canCancel && hasAcceptedPolicy);
  const checkoutNotCompleted = paymentStatus === "cancelled";

  const policyText = useMemo(
    () => {
      if (policy.isClinicInitiatedReschedule) {
        return "Seu horário original ficou indisponível. Você pode reagendar ou cancelar sem custo.";
      }
      return `1 remarcação sem custo, até ${policy.maxDaysAhead} dias e com mínimo de ${policy.minNoticeHours}h de antecedência. Cancelamentos também podem ser feitos até ${policy.minNoticeHours}h antes.`;
    },
    [policy.isClinicInitiatedReschedule, policy.maxDaysAhead, policy.minNoticeHours],
  );
  const instructionItems = useMemo(
    () => [
      {
        title: "Limite de remarcações",
        description: `Você já utilizou ${policy.reschedulesUsed} de ${policy.maxReschedules} remarcações disponíveis nesta reserva.`,
      },
      {
        title: "Como funciona a taxa de reserva",
        description:
          "A taxa funciona como sinal e é abatida no valor final da consulta quando o atendimento acontece normalmente.",
      },
      {
        title: "Nova taxa após remarcação gratuita",
        description:
          policy.requiresPaidReschedule && typeof policy.paidRescheduleAmountCents === "number"
            ? `Neste momento, a nova remarcação exige taxa de reserva de ${formatMoney(policy.paidRescheduleAmountCents)} para confirmar o novo horário.`
            : "Depois da remarcação gratuita prevista na política, novas alterações podem exigir nova taxa, sem abatimento.",
      },
      {
        title: "Regras de cancelamento e reembolso",
        description: policy.isClinicInitiatedReschedule
          ? "Como a indisponibilidade foi da clínica, o cancelamento é sem custo e com reembolso integral da taxa de reserva."
          : "Cancelamentos com mais de 24h de antecedência têm reembolso integral da taxa de reserva.",
      },
      {
        title: "Não comparecimento (no-show)",
        description:
          "Em caso de ausência, a taxa de reserva é retida e será necessário iniciar uma nova reserva.",
      },
    ],
    [
      policy.isClinicInitiatedReschedule,
      policy.maxReschedules,
      policy.paidRescheduleAmountCents,
      policy.requiresPaidReschedule,
      policy.reschedulesUsed,
    ],
  );

  function handleDateChange(nextDate: string) {
    setSelectedDate(nextDate);
    setSelectedTime("");
    setTimeLoadError(null);
    setError(null);
    setSuccess(null);
  }

  useEffect(() => {
    if (!selectedDate) {
      setIsLoadingTimes(false);
      setTimeLoadError(null);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(timesByDate, selectedDate)) {
      setIsLoadingTimes(false);
      setTimeLoadError(null);
      return;
    }

    const abortController = new AbortController();
    const params = new URLSearchParams({
      location: fixedLocation.value,
      targetDate: selectedDate,
    });

    setIsLoadingTimes(true);
    setTimeLoadError(null);

    void fetch(`/api/booking/options?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: abortController.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          options?: {
            dates?: Array<{ isoDate: string; times: string[] }>;
          };
        };
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Falha ao carregar horários.");
        }

        const dateOption = data.options?.dates?.find(
          (item) => item.isoDate === selectedDate,
        );
        setTimesByDate((previous) => ({
          ...previous,
          [selectedDate]: dateOption?.times ?? [],
        }));
      })
      .catch((fetchError: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }
        const message =
          fetchError instanceof Error ? fetchError.message : "Falha ao carregar horários.";
        setTimeLoadError(message);
        setTimesByDate((previous) => ({
          ...previous,
          [selectedDate]: [],
        }));
      })
      .finally(() => {
        if (abortController.signal.aborted) {
          return;
        }
        setIsLoadingTimes(false);
      });

    return () => {
      abortController.abort();
    };
  }, [fixedLocation.value, selectedDate, timesByDate]);

  useEffect(() => {
    if (!selectedDate) {
      if (selectedTime) {
        setSelectedTime("");
      }
      return;
    }
    if (selectedTime && !timeOptions.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, selectedTime, timeOptions]);

  function handleSubmit() {
    if (isPending) {
      return;
    }
    if (!canSubmit) {
      setError("Selecione data e horário para continuar.");
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/appointments/reschedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventTypeId: fixedEventType.id,
            location: fixedLocation.value,
            date: selectedDate,
            time: selectedTime,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error ?? "Não foi possível remarcar a consulta.");
        }
        if (data?.paymentRequired && typeof data?.url === "string" && data.url.length > 0) {
          toast.success("Redirecionando para o pagamento da nova taxa de remarcação.");
          window.location.assign(data.url);
          return;
        }
        setSuccess("Consulta remarcada com sucesso.");
        toast.success("Consulta remarcada com sucesso.");
        router.refresh();
        onCompleted?.();
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "Falha ao remarcar consulta.";
        setError(message);
        toast.error("Não foi possível remarcar a consulta.", {
          description: message,
        });
      }
    });
  }

  function handleCancelAppointment() {
    if (isPending) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/appointments/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error ?? "Não foi possível cancelar a consulta.");
        }
        setSuccess(
          "Consulta cancelada com sucesso. Você já pode iniciar uma nova reserva do zero.",
        );
        toast.success("Consulta cancelada com sucesso.");
        router.refresh();
        onCompleted?.();
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "Falha ao cancelar consulta.";
        setError(message);
        toast.error("Não foi possível cancelar a consulta.", {
          description: message,
        });
      }
    });
  }

  const rootClassName =
    displayMode === "embedded"
      ? "space-y-3"
      : "space-y-3 rounded-xl border border-border p-4";

  return (
    <section id="remarcacao-consulta" className={rootClassName}>
      <h3 className="font-medium">Remarcação facilitada</h3>
      {checkoutNotCompleted ? (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100">
          <AlertTitle>Pagamento não concluído</AlertTitle>
          <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
            Você saiu do checkout antes de finalizar a taxa de remarcação. Se o horário ainda estiver
            disponível, confirme novamente abaixo.
          </AlertDescription>
        </Alert>
      ) : null}
      <p className="text-sm text-muted-foreground">{policyText}</p>
      <p className="text-sm text-muted-foreground">
        Atendimento: <span className="font-medium text-foreground">{fixedEventType.label}</span>
      </p>
      <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
        <details className="group rounded-md border border-border/60 bg-background px-3 py-2">
          <summary className="cursor-pointer list-none text-sm font-medium">
            <span className="inline-block group-open:hidden">Ver instruções da política de remarcação</span>
            <span className="hidden group-open:inline">Ocultar instruções da política de remarcação</span>
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">
            Leia com atenção antes de confirmar. Estas regras definem como funcionam
            remarcação, cancelamento e reembolso da sua reserva.
          </p>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            {instructionItems.map((item) => (
              <li key={item.title} className="space-y-1 rounded-md border border-border/50 bg-muted/30 px-2 py-1.5">
                <p className="font-medium text-foreground">{item.title}</p>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </details>
        <label
          className={cn(
            "flex items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
            hasAcceptedPolicy
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/40",
          )}
        >
          <Checkbox
            checked={hasAcceptedPolicy}
            onCheckedChange={(checked) => setHasAcceptedPolicy(checked === true)}
          />
          <span>Li e concordo com as condições acima.</span>
        </label>
      </div>

      {!policy.canReschedule ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          {policy.reason ?? "Sua consulta não está elegível para remarcação automática."}
        </div>
      ) : null}
      {!policy.canCancel && policy.cancelReason ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          {policy.cancelReason}
        </div>
      ) : null}

      {policy.requiresHumanSupport ? (
        <div className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-3">
          <p className="text-sm text-muted-foreground">
            Para consultas com menos de {policy.minNoticeHours}h, o cancelamento e
            a remarcação automáticos ficam bloqueados. Continue pelo WhatsApp.
          </p>
          <Button asChild variant="secondary" size="sm">
            <a
              href="https://wa.me/5585999853811?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20cancelamento%20ou%20remarca%C3%A7%C3%A3o%20da%20minha%20consulta."
              target="_blank"
              rel="noreferrer"
            >
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      ) : null}

      {!policy.requiresHumanSupport ? (
        <>
      <div className="space-y-2">
        <p className="text-sm font-medium">1. Data</p>
        {availabilityError ? (
          <p className="text-sm text-destructive">{availabilityError}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {dateOptions.slice(0, 12).map((item) => (
            <Button
              key={item.isoDate}
              type="button"
              variant={selectedDate === item.isoDate ? "default" : "outline"}
              onClick={() => handleDateChange(item.isoDate)}
              disabled={!policy.canReschedule || isPending}
            >
              {item.weekdayLabel}, {formatIsoDateToPtBr(item.isoDate)}
            </Button>
          ))}
        </div>
        {dateOptions.length === 0 && !availabilityError ? (
          <p className="text-sm text-muted-foreground">Sem datas disponíveis para o local da sua consulta.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">2. Horário</p>
        {selectedDate ? (
          <p className="text-xs text-muted-foreground">
            {isLoadingTimes
              ? "Carregando horários disponíveis..."
              : "Horários disponíveis para a data selecionada."}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Escolha uma data para ver os horários.</p>
        )}
        {timeLoadError ? <p className="text-sm text-destructive">{timeLoadError}</p> : null}
        <div className="flex flex-wrap gap-2">
          {timeOptions.map((slot) => (
            <Button
              key={slot}
              type="button"
              variant={selectedTime === slot ? "default" : "outline"}
              onClick={() => setSelectedTime(slot)}
              disabled={!policy.canReschedule || isPending || isLoadingTimes}
            >
              {slot}
            </Button>
          ))}
        </div>
        {selectedDate && !isLoadingTimes && timeOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem horários para a data selecionada.</p>
        ) : null}
      </div>

      {!hasAcceptedPolicy ? (
        <p className="text-xs text-muted-foreground">
          Marque "Li e concordo com as condições acima" para liberar as ações.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <AlertDialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
          <Button
            type="button"
            disabled={!canSubmit || isPending}
            onClick={() => setIsRescheduleDialogOpen(true)}
          >
            {isPending
              ? "Processando..."
              : policy.requiresPaidReschedule
                ? "Prosseguir para pagamento"
                : "Remarcar consulta"}
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar remarcação?</AlertDialogTitle>
              <AlertDialogDescription>
                {policy.requiresPaidReschedule ? (
                  <>
                    O novo horário só será confirmado após pagamento de{" "}
                    <span className="font-medium text-foreground">
                      {formatMoney(policy.paidRescheduleAmountCents ?? 0)}
                    </span>
                    . Você será redirecionado para o checkout seguro.
                  </>
                ) : (
                  <>
                    Sua consulta atual será substituída por{" "}
                    <span className="font-medium text-foreground">
                      {selectedDate ? formatIsoDateToPtBr(selectedDate) : "data não selecionada"} às{" "}
                      {selectedTime || "horário não selecionado"}
                    </span>
                    .
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsRescheduleDialogOpen(false);
                  handleSubmit();
                }}
              >
                Confirmar remarcação
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !canCancel}
            onClick={() => setIsCancelDialogOpen(true)}
          >
            Cancelar consulta
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar cancelamento?</AlertDialogTitle>
              <AlertDialogDescription>
                {policy.isClinicInitiatedReschedule
                  ? "Seu horário original ficou indisponível. Este cancelamento será realizado sem custo, com reembolso integral da taxa de reserva."
                  : "Após o cancelamento, será necessário iniciar uma nova reserva. Reembolsos seguem as regras descritas nas instruções acima."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsCancelDialogOpen(false);
                  handleCancelAppointment();
                }}
              >
                Confirmar cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
        </>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}
    </section>
  );
}

function formatMoney(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function formatIsoDateToPtBr(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
