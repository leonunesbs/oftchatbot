"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

import type { PaymentMode } from "@/lib/booking-bootstrap";

type StartCheckoutButtonProps = {
  location: string;
  date: string;
  time: string;
  label?: string;
  secondaryAction?: ReactNode;
  isAuthenticated?: boolean;
  paymentMode?: PaymentMode;
  reservationAmountCents?: number;
  consultationAmountCents?: number;
  reservationFeePercent?: number;
};

type CheckoutErrorState = {
  title: string;
  description?: string;
  redirectTo?: string;
};

type CheckoutApiResponse = {
  ok?: boolean;
  url?: string;
  error?: string;
  errorDetails?: string;
  errorCode?: string;
  redirectTo?: string;
};

export function StartCheckoutButton({
  location,
  date,
  time,
  label = "Ir para pagamento",
  secondaryAction,
  paymentMode = "booking_fee",
  reservationAmountCents,
  consultationAmountCents,
  reservationFeePercent = 20,
}: StartCheckoutButtonProps) {
  const [isLoading, startCheckoutTransition] = useTransition();
  const [error, setError] = useState<CheckoutErrorState | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  async function handleStartCheckout() {
    if (isLoading) {
      return;
    }

    setError(null);
    startCheckoutTransition(async () => {
      try {
        trackEvent("submit_booking", {
          location,
          date,
          time,
          step: paymentMode === "in_person" ? "confirm_in_person" : "checkout",
        });

        if (paymentMode === "in_person") {
          await handleInPersonConfirmation();
        } else {
          await handleStripeCheckout();
        }
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? { title: checkoutError.message }
            : { title: "Falha ao processar o agendamento." },
        );
      }
    });
  }

  async function handleStripeCheckout() {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, date, time }),
    });
    const data = (await response
      .json()
      .catch(() => null)) as CheckoutApiResponse | null;
    if (requiresAuthentication(response, data)) {
      redirectToSignIn();
      return;
    }
    if (!response.ok || !data?.ok || typeof data.url !== "string") {
      handleErrorResponse(data);
      return;
    }
    const target = window.self !== window.top ? window.top! : window;
    target.location.href = data.url;
  }

  async function handleInPersonConfirmation() {
    const response = await fetch("/api/booking/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, date, time }),
    });
    const data = (await response
      .json()
      .catch(() => null)) as CheckoutApiResponse | null;
    if (requiresAuthentication(response, data)) {
      redirectToSignIn();
      return;
    }
    if (!response.ok || !data?.ok) {
      handleErrorResponse(data);
      return;
    }
    const redirectTo = data.redirectTo ?? "/dashboard?booking=confirmed";
    const target = window.self !== window.top ? window.top! : window;
    target.location.href = redirectTo;
  }

  function handleErrorResponse(data: CheckoutApiResponse | null) {
    const normalizedError = normalizeCheckoutError(data);
    setError(normalizedError);
    if (normalizedError.redirectTo) {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = setTimeout(() => {
        const target = window.self !== window.top ? window.top! : window;
        target.location.href = normalizedError.redirectTo!;
      }, 1200);
    }
  }

  const loadingLabel = paymentMode === "in_person"
    ? "Confirmando..."
    : "Redirecionando...";

  return (
    <div className="w-full space-y-2">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
        {secondaryAction ? (
          <div className="w-full sm:w-auto">{secondaryAction}</div>
        ) : null}
        <Button
          type="button"
          onClick={handleStartCheckout}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? loadingLabel : label}
        </Button>
      </div>

      <div className="w-full space-y-2">
        <p className="w-full rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground">
          {buildPaymentDisclaimer({
            paymentMode,
            reservationAmountCents,
            consultationAmountCents,
            reservationFeePercent,
          })}
        </p>

        {error ? (
          <div className="w-full rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <p className="font-semibold">{error.title}</p>
            {error.description ? (
              <p className="mt-1 text-xs leading-relaxed text-destructive/90">
                {error.description}
              </p>
            ) : null}
            {error.redirectTo ? (
              <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                <Button asChild size="sm" variant="outline">
                  <Link href={error.redirectTo}>Ir para meu agendamento</Link>
                </Button>
                <span className="text-xs text-destructive/80">
                  Redirecionando automaticamente...
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  function redirectToSignIn() {
    const returnBackUrl = getReturnBackUrl();
    const target = window.self !== window.top ? window.top! : window;
    target.location.href = `/sign-in?redirect_url=${encodeURIComponent(returnBackUrl)}`;
  }

  function getReturnBackUrl() {
    const topWindow = window.self !== window.top ? window.top! : window;
    try {
      return topWindow.location.href;
    } catch {
      return window.location.href;
    }
  }
}

function buildPaymentDisclaimer(input: {
  paymentMode: PaymentMode;
  reservationAmountCents?: number;
  consultationAmountCents?: number;
  reservationFeePercent: number;
}) {
  if (input.paymentMode === "in_person") {
    return "Ao confirmar, seu horário fica garantido. O pagamento será realizado presencialmente no dia da consulta.";
  }

  if (input.paymentMode === "full_payment") {
    if (
      typeof input.consultationAmountCents === "number" &&
      input.consultationAmountCents > 0
    ) {
      return `Pagamento online integral (cartão e Pix): ${formatMoney(input.consultationAmountCents)}.`;
    }
    return "Pagamento online integral (cartão e Pix) para confirmar o horário.";
  }

  const baseText =
    "Para confirmar o horário, realize agora um pagamento online (cartão ou Pix).";
  if (
    typeof input.reservationAmountCents !== "number" ||
    input.reservationAmountCents <= 0
  ) {
    return `${baseText} Composição da consulta: confirmação online + saldo presencial.`;
  }

  const reservationValue = formatMoney(input.reservationAmountCents);
  if (
    typeof input.consultationAmountCents === "number" &&
    input.consultationAmountCents > 0
  ) {
    return `${baseText} Composição da consulta: ${reservationValue} agora + saldo no dia. Esse valor representa ${input.reservationFeePercent}% de ${formatMoney(input.consultationAmountCents)}.`;
  }
  return `${baseText} Composição da consulta: ${reservationValue} agora + saldo presencial no dia da consulta.`;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function requiresAuthentication(
  response: Response,
  data: CheckoutApiResponse | null,
): boolean {
  if (response.status === 401) {
    return true;
  }

  if (response.redirected && isSignInUrl(response.url)) {
    return true;
  }

  const rawError = typeof data?.error === "string" ? data.error : "";
  const normalizedError = rawError.trim().toLowerCase();
  return (
    normalizedError === "not authenticated" ||
    normalizedError.includes("not authenticated") ||
    normalizedError.includes("não autenticado") ||
    normalizedError.includes("nao autenticado")
  );
}

function isSignInUrl(url: string): boolean {
  if (url.trim().length === 0) {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.pathname === "/sign-in";
  } catch {
    return false;
  }
}

function normalizeCheckoutError(
  data: CheckoutApiResponse | null,
): CheckoutErrorState {
  if (data?.errorCode === "ACTIVE_APPOINTMENT_EXISTS" && data.redirectTo) {
    return {
      title: data.error || "Você já possui um agendamento ativo.",
      description:
        data.errorDetails ||
        "Você será redirecionado para o painel para gerenciar seu agendamento.",
      redirectTo: data.redirectTo,
    };
  }
  if (data?.errorCode === "PENDING_RESERVATION_EXISTS" && data.redirectTo) {
    return {
      title: data.error || "Você já possui um agendamento pendente.",
      description:
        data.errorDetails ||
        "Gerencie primeiro o agendamento pendente no painel.",
      redirectTo: data.redirectTo,
    };
  }
  if (typeof data?.error === "string" && data.error.trim().length > 0) {
    const sanitizedTitle = sanitizeBackendErrorMessage(data.error);
    const sanitizedDetails =
      typeof data.errorDetails === "string" && data.errorDetails.trim().length > 0
        ? sanitizeBackendErrorMessage(data.errorDetails)
        : undefined;

    return {
      title: "Não foi possível concluir essa etapa.",
      description: sanitizedDetails ?? sanitizedTitle,
      redirectTo:
        typeof data.redirectTo === "string" ? data.redirectTo : undefined,
    };
  }
  return {
    title: "Não foi possível processar o agendamento.",
  };
}

function sanitizeBackendErrorMessage(rawMessage: string): string {
  if (rawMessage.trim().length === 0) {
    return "Tente novamente em instantes.";
  }

  const cleanedMessage = rawMessage
    .replace(/\[Request ID:[^\]]+\]\s*/gi, "")
    .replace(/Server Error\s*/gi, "")
    .replace(/Uncaught Error:\s*/gi, "")
    .replace(/\s+at\s+[^\n]+/gi, "")
    .replace(/^\(.+\)$/gim, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanedMessage.length === 0) {
    return "Tente novamente em instantes.";
  }

  const normalizedMessage = cleanedMessage
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  if (
    normalizedMessage === "not authenticated" ||
    normalizedMessage.includes("not authenticated") ||
    normalizedMessage.includes("nao autenticado")
  ) {
    return "Sua sessão expirou. Faça login novamente para continuar.";
  }

  if (
    normalizedMessage === "not authorized" ||
    normalizedMessage.includes("not authorized") ||
    normalizedMessage.includes("nao autorizado")
  ) {
    return "Seu perfil não tem permissão para concluir esta etapa.";
  }

  return cleanedMessage;
}
