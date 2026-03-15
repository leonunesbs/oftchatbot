"use client";

import { upsertAvailabilityDateOverridesAction } from "@/app/dashboard/admin/actions";
import { ActionToastForm } from "@/components/action-toast-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { closeParallelRoute } from "@/lib/parallel-route-navigation";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

type AvailabilityGroupOption = {
  name: string;
  timezone: string;
};

type AdminCreateTimeBlockViewProps = {
  availabilityGroups: AvailabilityGroupOption[];
  initialDate?: string;
  initialTime?: string;
  asDrawer: boolean;
  backHref: string;
};

function addMinutesToTime(value: string, minutesToAdd: number) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return "09:30";
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return "09:30";
  }
  const totalMinutes = (hour * 60 + minute + minutesToAdd + 24 * 60) % (24 * 60);
  const nextHour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const nextMinute = String(totalMinutes % 60).padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function TimeBlockForm({
  availabilityGroups,
  initialDate,
  initialTime,
  backHref,
}: {
  availabilityGroups: AvailabilityGroupOption[];
  initialDate?: string;
  initialTime?: string;
  backHref: string;
}) {
  const router = useRouter();
  const formId = useId();
  const [groupName, setGroupName] = useState(availabilityGroups[0]?.name ?? "");
  const [date, setDate] = useState(() => (initialDate && isIsoDate(initialDate) ? initialDate : ""));
  const [startTime, setStartTime] = useState(() => (initialTime && isTime(initialTime) ? initialTime : "09:00"));
  const [endTime, setEndTime] = useState(() =>
    initialTime && isTime(initialTime) ? addMinutesToTime(initialTime, 30) : "09:30",
  );

  const timezone = useMemo(() => {
    const selected = availabilityGroups.find((group) => group.name === groupName);
    return selected?.timezone || "America/Fortaleza";
  }, [availabilityGroups, groupName]);

  useEffect(() => {
    if (!availabilityGroups.some((group) => group.name === groupName)) {
      setGroupName(availabilityGroups[0]?.name ?? "");
    }
  }, [availabilityGroups, groupName]);

  if (availabilityGroups.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Nenhuma disponibilidade encontrada. Cadastre uma disponibilidade antes de bloquear horários.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => closeParallelRoute(router, backHref)}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ActionToastForm
      id={formId}
      action={upsertAvailabilityDateOverridesAction}
      className="grid gap-3"
      successMessage="Bloqueio de horário salvo com sucesso."
      errorMessage="Não foi possível salvar o bloqueio de horário."
      onSuccess={() => closeParallelRoute(router, backHref)}
    >
      <input type="hidden" name="groupName" value={groupName} />
      <input type="hidden" name="timezone" value={timezone} />
      <input type="hidden" name="allDayUnavailable" value="false" />
      <input type="hidden" name="dates" value={JSON.stringify([date])} />
      <input
        type="hidden"
        name="slots"
        value={JSON.stringify([
          {
            startTime,
            endTime,
            status: "inactive",
          },
        ])}
      />

      <div className="grid gap-1">
        <label htmlFor="time-block-group" className="text-xs font-medium text-muted-foreground">
          Disponibilidade
        </label>
        <select
          id="time-block-group"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          className="h-9 rounded-md border border-input bg-input/20 px-2 text-sm"
          required
        >
          {availabilityGroups.map((group) => (
            <option key={group.name} value={group.name}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <label htmlFor="time-block-date" className="text-xs font-medium text-muted-foreground">
            Data
          </label>
          <Input
            id="time-block-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1">
          <p className="text-xs font-medium text-muted-foreground">Fuso horário</p>
          <p className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {timezone}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <label htmlFor="time-block-start" className="text-xs font-medium text-muted-foreground">
            Início
          </label>
          <Input
            id="time-block-start"
            type="time"
            step={300}
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="time-block-end" className="text-xs font-medium text-muted-foreground">
            Fim
          </label>
          <Input
            id="time-block-end"
            type="time"
            step={300}
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            required
          />
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" disabled={!date || !isIsoDate(date) || !isTime(startTime) || !isTime(endTime)}>
            Salvar bloqueio
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar bloqueio de horário?</AlertDialogTitle>
            <AlertDialogDescription>
              Este horário ficará indisponível para novos agendamentos na disponibilidade selecionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction form={formId} type="submit">
              Confirmar bloqueio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ActionToastForm>
  );
}

export function AdminCreateTimeBlockView({
  availabilityGroups,
  initialDate,
  initialTime,
  asDrawer,
  backHref,
}: AdminCreateTimeBlockViewProps) {
  const router = useRouter();

  if (asDrawer) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) {
            closeParallelRoute(router, backHref);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bloquear horário</DialogTitle>
            <DialogDescription>
              Bloqueie uma faixa específica para impedir novos agendamentos nesse período.
            </DialogDescription>
          </DialogHeader>
          <TimeBlockForm
            availabilityGroups={availabilityGroups}
            initialDate={initialDate}
            initialTime={initialTime}
            backHref={backHref}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <Card variant="flat-mobile" className="border-border/70">
        <CardHeader>
          <CardTitle>Bloquear horário</CardTitle>
          <CardDescription>
            Bloqueie uma faixa específica para impedir novos agendamentos nesse período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimeBlockForm
            availabilityGroups={availabilityGroups}
            initialDate={initialDate}
            initialTime={initialTime}
            backHref={backHref}
          />
        </CardContent>
      </Card>
    </div>
  );
}
