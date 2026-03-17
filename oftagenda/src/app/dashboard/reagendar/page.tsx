import Link from "next/link";

import { getPatientRescheduleData } from "@/app/dashboard/_lib/patient-reschedule";
import { RescheduleAppointmentCard } from "@/components/reschedule-appointment-card";
import { Button } from "@/components/ui/button";

type DashboardReschedulePageProps = {
  searchParams?:
    | Promise<{
        payment?: string;
        location?: string;
        date?: string;
        time?: string;
      }>
    | {
        payment?: string;
        location?: string;
        date?: string;
        time?: string;
      };
};

export default async function DashboardReschedulePage({
  searchParams,
}: DashboardReschedulePageProps) {
  const params = (await searchParams) ?? {};
  const payment = params.payment ?? "";
  const initialDate = params.date ?? "";
  const initialTime = params.time ?? "";
  const initialLocation = params.location ?? "";
  const checkoutNotCompleted = payment === "cancelled";
  const rescheduleData = await getPatientRescheduleData();
  if (!rescheduleData) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-4">
        <h1 className="text-lg font-semibold">Reagendamento indisponível</h1>
        <p className="text-sm text-muted-foreground">
          Você precisa ter uma consulta ativa para reagendar.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Voltar ao painel</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Reagendar consulta</h1>
          {checkoutNotCompleted ? (
            <p className="text-sm text-muted-foreground">
              Seu pagamento foi interrompido. Revise os dados e tente novamente.
            </p>
          ) : null}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Voltar ao painel</Link>
        </Button>
      </div>
      <RescheduleAppointmentCard
        policy={rescheduleData.policy}
        fixedEventType={rescheduleData.fixedEventType}
        fixedLocation={rescheduleData.fixedLocation}
        dateOptions={rescheduleData.dateOptions}
        availabilityError={rescheduleData.availabilityError}
        paymentStatus={payment}
        initialDate={initialLocation === rescheduleData.fixedLocation.value ? initialDate : ""}
        initialTime={initialLocation === rescheduleData.fixedLocation.value ? initialTime : ""}
      />
    </section>
  );
}
