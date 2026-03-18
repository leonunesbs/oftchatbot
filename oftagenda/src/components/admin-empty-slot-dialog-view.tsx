"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminCreateAppointmentForm } from "@/components/admin-create-appointment-form";
import {
  TimeBlockForm,
  type TimeBlockAvailabilityGroupOption,
} from "@/components/admin-create-time-block-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  closeParallelRoute,
  useParallelRouteBackHref,
} from "@/lib/parallel-route-navigation";
import { usePathname, useRouter } from "next/navigation";

type EventTypeOption = {
  _id: string;
  slug: string;
  name?: string;
  title: string;
  kind?: "consulta" | "procedimento" | "exame";
  availabilityId?: string;
  active: boolean;
};

type AppointmentAvailabilityGroupOption = {
  name: string;
  representativeId: string;
};

type EmptySlotMode = "appointment" | "block";

type AdminEmptySlotDialogViewProps = {
  eventTypes: EventTypeOption[];
  appointmentAvailabilityGroups: AppointmentAvailabilityGroupOption[];
  timeBlockAvailabilityGroups: TimeBlockAvailabilityGroupOption[];
  initialDate?: string;
  initialTime?: string;
  asDrawer: boolean;
  backHref: string;
};

export function AdminEmptySlotDialogView({
  eventTypes,
  appointmentAvailabilityGroups,
  timeBlockAvailabilityGroups,
  initialDate,
  initialTime,
  asDrawer,
  backHref,
}: AdminEmptySlotDialogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedBackHref = useParallelRouteBackHref(backHref);
  const [isOpen, setIsOpen] = useState(true);
  const closeRequestedRef = useRef(false);
  const [mode, setMode] = useState<EmptySlotMode>("appointment");
  const handleCloseDialog = useCallback(() => {
    if (closeRequestedRef.current) {
      return;
    }
    closeRequestedRef.current = true;
    setIsOpen(false);

    window.setTimeout(() => {
      closeParallelRoute(router, backHref, resolvedBackHref);
    }, 120);
  }, [backHref, resolvedBackHref, router]);

  useEffect(() => {
    if (!asDrawer) {
      return;
    }
    const backPath = resolvedBackHref.split("?")[0]?.split("#")[0] ?? resolvedBackHref;
    if (pathname !== backPath) {
      closeRequestedRef.current = false;
      setIsOpen(true);
    }
  }, [asDrawer, pathname, resolvedBackHref]);

  const content = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "appointment" ? "default" : "outline"}
          onClick={() => setMode("appointment")}
        >
          Agendar paciente
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "block" ? "default" : "outline"}
          onClick={() => setMode("block")}
        >
          Bloquear horário
        </Button>
      </div>

      {mode === "appointment" ? (
        <AdminCreateAppointmentForm
          eventTypes={eventTypes}
          availabilityGroups={appointmentAvailabilityGroups}
          initialDate={initialDate}
          initialTime={initialTime}
        />
      ) : (
        <TimeBlockForm
          availabilityGroups={timeBlockAvailabilityGroups}
          initialDate={initialDate}
          initialTime={initialTime}
          backHref={backHref}
        />
      )}
    </div>
  );

  if (asDrawer) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ações para horário vazio</DialogTitle>
            <DialogDescription>
              Escolha se deseja criar um agendamento manual ou bloquear este horário.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="mx-auto w-full max-w-2xl p-4">{content}</div>;
}
