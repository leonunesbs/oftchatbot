import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  Clock3Icon,
  MailIcon,
  MessageCircleHeartIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
} from "lucide-react";

import { BookingConfirmedEvent } from "@/components/booking-confirmed-event";
import { ActionToastForm } from "@/components/action-toast-form";
import { BirthDatePickerField } from "@/components/birth-date-picker-field";
import { CheckoutReturnUrlCleaner } from "@/components/checkout-return-url-cleaner";
import { PendingReservationsList } from "@/components/pending-reservations-list";
import { PhoneLinkCard } from "@/components/phone-link-card";
import { upsertPatientBirthDateAction } from "@/app/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appendParallelRouteOrigin } from "@/lib/parallel-route-origin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getUserRoleFromClerkAuth, hasConfirmedBooking } from "@/lib/access";
import { getAuthenticatedConvexHttpClient } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

type DashboardPageProps = {
  searchParams?: Promise<{
    booking?: string;
    payment?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const booking = params.booking ?? "";
  const payment = params.payment ?? "";
  const bookingJustConfirmed = booking === "confirmed";
  const paymentJustSucceeded = payment === "success";
  const shouldShowCelebration = bookingJustConfirmed || paymentJustSucceeded;
  const authData = await auth();
  const role = await getUserRoleFromClerkAuth(authData);
  const isAdmin = role === "admin";
  const contactEmail = await resolveUserEmailFromAuthData(authData);

  let dashboardState: {
    hasConfirmedBooking: boolean;
    nextAppointment: {
      _id: string;
      scheduledFor?: number;
      eventSlug?: string | null;
      eventName?: string | null;
      eventAddress?: string | null;
      paymentMode?: "booking_fee" | "full_payment" | "in_person" | null;
      status: string;
    } | null;
    pendingReservations: Array<{
      _id: string;
      startsAt: number;
      holdExpiresAt: number;
      consultationType: string;
      checkoutEventType: string;
      checkoutDate: string;
      checkoutTime: string;
    }>;
    reschedulePolicy: {
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
    };
    history: Array<{
      _id: string;
      status: string;
      requestedAt: number;
    }>;
  } = {
    hasConfirmedBooking: false,
    nextAppointment: null,
    pendingReservations: [],
    reschedulePolicy: {
      canReschedule: false,
      canCancel: false,
      isClinicInitiatedReschedule: false,
      cancelReason: "Nenhuma consulta ativa encontrada.",
      requiresHumanSupport: false,
      reason: "Nenhuma consulta ativa encontrada.",
      maxReschedules: 1,
      reschedulesUsed: 0,
      minNoticeHours: 24,
      maxDaysAhead: 30,
    },
    history: [],
  };
  let phoneLinkStatus: { linked: boolean; phone?: string } = { linked: false };
  let patientBirthDate = "";
  try {
    const { client } = await getAuthenticatedConvexHttpClient();
    const phoneLinkResult = await client.query(api.phonelinks.getPhoneLinkByClerkUser, {
      clerkUserId: authData.userId!,
    });
    if (phoneLinkResult) {
      const masked = phoneLinkResult.phone.length > 4
        ? `${"*".repeat(phoneLinkResult.phone.length - 4)}${phoneLinkResult.phone.slice(-4)}`
        : phoneLinkResult.phone;
      phoneLinkStatus = { linked: true, phone: masked };
    }
    const patient = await client.query(api.patients.getCurrentPatient, {});
    patientBirthDate = patient?.birthDate ?? "";
    const data = await client.query(api.appointments.getDashboardState, {});
    dashboardState = {
      hasConfirmedBooking: data.hasConfirmedBooking,
      nextAppointment: data.nextAppointment
        ? {
            _id: data.nextAppointment._id,
            scheduledFor: data.nextAppointment.scheduledFor,
            eventSlug: data.nextAppointment.eventSlug ?? null,
            eventName: data.nextAppointment.eventName ?? null,
            eventAddress: data.nextAppointment.eventAddress ?? null,
            paymentMode: data.nextAppointment.paymentMode ?? null,
            status: data.nextAppointment.status,
          }
        : null,
      pendingReservations: data.pendingReservations.map((item) => ({
        _id: item._id,
        startsAt: item.startsAt,
        holdExpiresAt: item.holdExpiresAt,
        consultationType: item.consultationType,
        checkoutEventType: item.checkoutEventType,
        checkoutDate: item.checkoutDate,
        checkoutTime: item.checkoutTime,
      })),
      reschedulePolicy: {
        canReschedule: data.reschedulePolicy.canReschedule,
        canCancel: data.reschedulePolicy.canCancel,
        isClinicInitiatedReschedule: data.reschedulePolicy.isClinicInitiatedReschedule,
        cancelReason: data.reschedulePolicy.cancelReason,
        requiresHumanSupport: data.reschedulePolicy.requiresHumanSupport,
        reason: data.reschedulePolicy.reason,
        maxReschedules: data.reschedulePolicy.maxReschedules,
        reschedulesUsed: data.reschedulePolicy.reschedulesUsed,
        minNoticeHours: data.reschedulePolicy.minNoticeHours,
        maxDaysAhead: data.reschedulePolicy.maxDaysAhead,
      },
      history: data.history.map((item) => ({
        _id: item._id,
        status: item.status,
        requestedAt: item.requestedAt,
      })),
    };
  } catch {
    dashboardState.hasConfirmedBooking = await hasConfirmedBooking();
  }

  const bookingConfirmed = dashboardState.hasConfirmedBooking;
  const hasPendingReschedule = dashboardState.pendingReservations.length > 0;
  const nextAppointment = dashboardState.nextAppointment;
  const latestNoShow =
    !bookingConfirmed && dashboardState.history[0]?.status === "no_show";
  const birthDate = parseBirthDate(patientBirthDate);
  const patientAge = birthDate ? calculateAge(birthDate) : null;
  const hasPriorityByAge = typeof patientAge === "number" && patientAge >= 65;
  const appointmentStart = resolveAppointmentStart(nextAppointment?.scheduledFor);
  const appointmentLocation =
    nextAppointment?.eventAddress || "Local a confirmar";
  const appointmentDateLabel = formatDisplayDate(nextAppointment?.scheduledFor);
  const appointmentTimeLabel = formatDisplayTime(nextAppointment?.scheduledFor);
  const appointmentCountdownLabel = formatAppointmentCountdown(nextAppointment?.scheduledFor);
  const calendarLinks = appointmentStart
    ? buildCalendarLinks({
        title: "Consulta com Dr Leonardo",
        description:
          "Sua consulta está confirmada. Se precisar, entre em contato pelo WhatsApp para confirmar ou reagendar.",
        location: appointmentLocation,
        startsAt: appointmentStart,
        durationMinutes: 60,
      })
    : null;
  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <BookingConfirmedEvent enabled={bookingConfirmed} />
      <CheckoutReturnUrlCleaner enabled={paymentJustSucceeded} />

      <Card
        variant="flat-mobile"
        className="border-border/70 max-md:overflow-visible"
      >
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3">
              Painel do paciente
            </Badge>
            {hasPriorityByAge ? (
              <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                Prioridade 65+
              </Badge>
            ) : null}
          </div>
          <CardTitle>Olá! Aqui você tem controle total do seu atendimento.</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Você está em modo administrador. Use o atalho abaixo para gestão."
              : "Acompanhe sua consulta, organize informações e acione suporte quando precisar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {shouldShowCelebration ? (
            <div className="space-y-4 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Consulta confirmada com sucesso.
                </h3>
                <p className="text-sm text-emerald-900/90 dark:text-emerald-200/90">
                  Seu horário já está reservado. Agora é só se preparar para chegar com tranquilidade.
                </p>
              </div>

              {bookingConfirmed && nextAppointment ? (
                <div className="rounded-lg border border-emerald-500/30 bg-background/70 p-3">
                  <p className="text-sm font-medium text-foreground">
                    Próxima consulta: {appointmentDateLabel} às {appointmentTimeLabel}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {appointmentCountdownLabel}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80">
                  Estamos finalizando os detalhes da sua consulta. Atualize em instantes para ver data e horário.
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild size="sm">
                  <Link href="#proximo-agendamento">
                    Ver detalhes da consulta
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/detalhes">Fazer triagem agora</Link>
                </Button>
              </div>

              <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-900/80 dark:text-emerald-200/80">
                  Próximos passos rápidos
                </p>
                <ul className="space-y-1 text-sm text-emerald-900/90 dark:text-emerald-200/90">
                  <li>1. Salve o horário no calendário para não esquecer.</li>
                  <li>2. Revise sua triagem para agilizar o atendimento.</li>
                  <li>3. Se precisar, fale com a clínica pelo WhatsApp.</li>
                </ul>
              </div>

              {calendarLinks ? (
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={calendarLinks.googleCalendarHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Salvar no Google Agenda
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={calendarLinks.icsHref}
                      download="consulta-dr-leonardo.ics"
                    >
                      Salvar no calendário do celular
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {isAdmin ? (
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
              <h3 className="font-medium">Acesso administrativo</h3>
              <Button variant="secondary" asChild>
                <Link href="/dashboard/admin">Abrir painel admin</Link>
              </Button>
            </div>
          ) : null}

          {latestNoShow ? (
            <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <h3 className="font-medium text-amber-900 dark:text-amber-200">
                Consulta marcada como no-show
              </h3>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90">
                O horário de início já passou, então este agendamento foi encerrado automaticamente.
                Você já pode criar uma nova reserva conforme regulamento.
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 max-md:gap-0 max-md:divide-y max-md:divide-border/60 lg:grid-cols-2">
            <Card
              id="proximo-agendamento"
              className="border-border/80 max-md:rounded-none max-md:bg-transparent max-md:py-5 max-md:shadow-none max-md:ring-0"
            >
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheckIcon className="size-4 text-emerald-600" />
                  Cadastro com prioridade
                </CardTitle>
                <CardDescription>
                  Informe sua data de nascimento para manter seu cadastro completo e agilizar o atendimento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                  {hasPriorityByAge ? (
                    <p className="text-emerald-900 dark:text-emerald-200">
                      Prioridade ativa: {patientAge} anos cadastrados.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Sua data de nascimento ajuda a validar seu cadastro e agiliza confirmações futuras.
                    </p>
                  )}
                </div>
                <ActionToastForm
                  action={upsertPatientBirthDateAction}
                  className="grid w-full min-w-0 gap-3"
                  successMessage="Data de nascimento salva com sucesso."
                  errorMessage="Não foi possível salvar a data de nascimento."
                >
                  <Label>Data de nascimento</Label>
                  <BirthDatePickerField defaultValue={patientBirthDate} />
                  <Button type="submit" variant="outline">
                    Salvar data de nascimento
                  </Button>
                </ActionToastForm>
              </CardContent>
            </Card>

            <Card className="border-border/80 max-md:rounded-none max-md:bg-transparent max-md:py-5 max-md:shadow-none max-md:ring-0">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarCheck2Icon className="size-4 text-primary" />
                  Próximo agendamento
                </CardTitle>
                <CardDescription>
                  Detalhes da sua próxima consulta e atalhos rápidos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookingConfirmed && nextAppointment ? (
                  <>
                    <div className="grid gap-3 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2">
                        <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>
                          <span className="font-medium text-foreground">Data:</span>{" "}
                          {appointmentDateLabel}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Clock3Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>
                          <span className="font-medium text-foreground">Horário:</span>{" "}
                          {appointmentTimeLabel}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Evento:</span>{" "}
                        {nextAppointment.eventName ?? "A confirmar"}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Endereço:</span>{" "}
                        {nextAppointment.eventAddress ?? "A confirmar"}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Modo de pagamento:</span>{" "}
                        {formatPaymentModeLabel(nextAppointment.paymentMode)}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button variant="outline" asChild>
                        <Link
                          href={appendParallelRouteOrigin("/dashboard/reagendar", "/dashboard")}
                        >
                          <CalendarClockIcon className="size-4" />
                          Reagendar
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link
                          href={appendParallelRouteOrigin("/dashboard/reagendar", "/dashboard")}
                        >
                          <CalendarCheck2Icon className="size-4" />
                          Cancelar
                        </Link>
                      </Button>
                      <Button variant="secondary" asChild className="sm:col-span-2">
                        <Link
                          href="https://wa.me/5585999853811?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20minha%20consulta%20no%20painel%20do%20paciente."
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircleHeartIcon className="size-4" />
                          Entrar em contato
                        </Link>
                      </Button>
                    </div>

                    {calendarLinks ? (
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={calendarLinks.googleCalendarHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Salvar no Google Agenda
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={calendarLinks.icsHref}
                            download="consulta-dr-leonardo.ics"
                          >
                            Salvar no calendário do celular
                          </a>
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : hasPendingReschedule ? (
                  <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                    <p className="text-sm text-muted-foreground">
                      Você possui um agendamento pendente de remarcação. Finalize-o para voltar a reservar.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="#agendamentos-pendentes">Ver pendentes</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/15 p-3">
                    <p className="text-sm text-muted-foreground">
                      Você ainda não possui consulta confirmada.
                    </p>
                    <Button asChild size="sm">
                      <Link href="/agendar">Agendar consulta</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 max-md:rounded-none max-md:bg-transparent max-md:py-5 max-md:shadow-none max-md:ring-0">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StethoscopeIcon className="size-4 text-primary" />
                  Triagem de dilatação
                </CardTitle>
                <CardDescription>
                  Confira as orientações e veja se há chance de dilatação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Assim, você consegue se programar melhor para o dia da consulta.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/detalhes">Verificar triagem e detalhes</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/80 max-md:rounded-none max-md:bg-transparent max-md:py-5 max-md:shadow-none max-md:ring-0">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MailIcon className="size-4 text-primary" />
                  Conexões de contato
                </CardTitle>
                <CardDescription>
                  Confira seus canais vinculados para receber avisos da clínica.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email cadastrado no Clerk
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {contactEmail ?? "Email não disponível na sessão atual"}
                  </p>
                </div>

                <PhoneLinkCard linked={phoneLinkStatus.linked} maskedPhone={phoneLinkStatus.phone} />

                <Button variant="secondary" asChild>
                  <Link
                    href="https://wa.me/5585999853811?text=Ol%C3%A1!%20Vim%20pela%20Minha%20Agenda%20e%20gostaria%20de%20confirmar/reagendar%20minha%20consulta."
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircleHeartIcon className="size-4" />
                    Suporte via WhatsApp
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {bookingConfirmed && nextAppointment ? (
            <div className="space-y-4 rounded-xl border border-border p-4">
              <h3 className="font-medium">Resumo rápido da consulta</h3>
              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <p>
                  <span className="font-medium text-foreground">Evento:</span>{" "}
                  {nextAppointment.eventName ?? "A confirmar"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Endereço:</span>{" "}
                  {nextAppointment.eventAddress ?? "A confirmar"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Data:</span>{" "}
                  {appointmentDateLabel}
                </p>
                <p>
                  <span className="font-medium text-foreground">Modo de pagamento:</span>{" "}
                  {formatPaymentModeLabel(nextAppointment.paymentMode)}
                </p>
              </div>
            </div>
          ) : null}

          {bookingConfirmed ? (
            <div id="remarcacao-consulta" className="space-y-3 rounded-xl border border-border p-4">
              <h3 className="font-medium">Remarcação e cancelamento</h3>
              <p className="text-sm text-muted-foreground">
                Abra o assistente interativo para remarcar ou cancelar sua consulta sem sair do painel.
              </p>
              <Button asChild>
                <Link
                  href={appendParallelRouteOrigin("/dashboard/reagendar", "/dashboard")}
                >
                  <CalendarClockIcon className="size-4" />
                  Abrir assistente de remarcação
                </Link>
              </Button>
            </div>
          ) : null}

          <div id="agendamentos-pendentes" className="space-y-2">
            <h3 className="font-medium">Agendamentos pendentes</h3>
            <PendingReservationsList
              reservations={dashboardState.pendingReservations}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function resolveAppointmentStart(nextAppointmentTimestamp?: number) {
  if (typeof nextAppointmentTimestamp === "number") {
    return new Date(nextAppointmentTimestamp);
  }
  return null;
}

function formatDisplayDate(timestamp?: number) {
  if (typeof timestamp !== "number") {
    return "A confirmar";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
  }).format(new Date(timestamp));
}

function formatDisplayTime(timestamp?: number) {
  if (typeof timestamp !== "number") {
    return "A confirmar";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatAppointmentCountdown(timestamp?: number) {
  if (typeof timestamp !== "number") {
    return "Os detalhes da consulta serão exibidos em breve.";
  }

  const now = Date.now();
  const diffMs = timestamp - now;
  if (diffMs <= 0) {
    return "Sua consulta está próxima. Em caso de necessidade, fale com a clínica.";
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);
  if (days === 0) {
    return "Falta menos de 1 dia para sua consulta.";
  }
  if (days === 1) {
    return "Falta 1 dia para sua consulta.";
  }
  return `Faltam ${days} dias para sua consulta.`;
}

function formatPaymentModeLabel(
  paymentMode?: "booking_fee" | "full_payment" | "in_person" | null,
) {
  if (paymentMode === "booking_fee") {
    return "Sinal de reserva";
  }
  if (paymentMode === "full_payment") {
    return "Pagamento integral";
  }
  if (paymentMode === "in_person") {
    return "Pagamento presencial";
  }
  return "A confirmar";
}

function parseBirthDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function calculateAge(birthDate: Date) {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

async function resolveUserEmailFromAuthData(authData: Awaited<ReturnType<typeof auth>>) {
  const fromSession = resolveUserEmailFromClaims(authData.sessionClaims);
  if (fromSession) {
    return fromSession;
  }

  try {
    const token = await authData.getToken({ template: "convex" });
    if (!token) {
      return null;
    }
    const jwtClaims = decodeJwtClaims(token);
    return resolveUserEmailFromClaims(jwtClaims);
  } catch {
    return null;
  }
}

function resolveUserEmailFromClaims(sessionClaims: unknown) {
  if (!sessionClaims || typeof sessionClaims !== "object") {
    return null;
  }

  const claims = sessionClaims as Record<string, unknown>;
  const emailCandidates = [claims.email, claims.email_address, claims.primary_email_address];
  for (const candidate of emailCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
}

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  const payload = parts[1];
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decodedPayload = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(decodedPayload);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function buildCalendarLinks({
  title,
  description,
  location,
  startsAt,
  durationMinutes,
}: {
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  durationMinutes: number;
}) {
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  const startCalendar = formatCalendarDate(startsAt);
  const endCalendar = formatCalendarDate(endsAt);
  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    location,
    dates: `${startCalendar}/${endCalendar}`,
  });

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//oftagenda//Booking Calendar//PT-BR",
    "BEGIN:VEVENT",
    `UID:${createIcsUid(startsAt)}@oftagenda`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${startCalendar}`,
    `DTEND:${endCalendar}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    googleCalendarHref: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    icsHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`,
  };
}

function formatCalendarDate(date: Date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}`;
}

function createIcsUid(startsAt: Date) {
  return `consulta-${startsAt.getTime()}`;
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}
