"use client";

import { useRouter } from "next/navigation";

import { RescheduleAppointmentCard } from "@/components/reschedule-appointment-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { closeParallelRoute } from "@/lib/parallel-route-navigation";

type PatientRescheduleDialogProps = {
  policy: {
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
    requiresPaidReschedule: boolean;
    paidRescheduleAmountCents: number | null;
  };
  fixedEventType: {
    id: string;
    label: string;
  };
  fixedLocation: {
    value: string;
    label: string;
  };
  dateOptions: Array<{
    isoDate: string;
    label: string;
    weekdayLabel: string;
    times: string[];
  }>;
  availabilityError?: string;
  backHref: string;
};

export function PatientRescheduleDialog({
  policy,
  fixedEventType,
  fixedLocation,
  dateOptions,
  availabilityError,
  backHref,
}: PatientRescheduleDialogProps) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          closeParallelRoute(router, backHref);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Reagendar consulta</DialogTitle>
          <DialogDescription>
            Escolha uma nova data e horário para a mesma unidade do atendimento atual.
          </DialogDescription>
        </DialogHeader>
        <RescheduleAppointmentCard
          policy={policy}
          fixedEventType={fixedEventType}
          fixedLocation={fixedLocation}
          dateOptions={dateOptions}
          availabilityError={availabilityError}
          displayMode="embedded"
          onCompleted={() => closeParallelRoute(router, backHref)}
        />
      </DialogContent>
    </Dialog>
  );
}
