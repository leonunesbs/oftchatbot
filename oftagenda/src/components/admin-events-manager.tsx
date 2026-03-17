"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createReservationAction,
  deleteEventTypeAction,
  deleteReservationAction,
  setEventTypeActiveAction,
  updateReservationAction,
} from "@/app/dashboard/admin/actions";
import { ActionToastForm } from "@/components/action-toast-form";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { appendParallelRouteOrigin } from "@/lib/parallel-route-origin";

const selectClassName = "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs";

const kindClassName: Record<"consulta" | "exame" | "procedimento", string> = {
  consulta: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  exame: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  procedimento: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
};

const paymentModeLabels: Record<string, string> = {
  booking_fee: "Taxa de reserva",
  full_payment: "Reserva completa",
  in_person: "Pagamento presencial",
};

const paymentModeClassName: Record<string, string> = {
  booking_fee: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  full_payment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  in_person: "bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200",
};

type EventTypeRow = {
  _id: string;
  slug: string;
  name?: string;
  title: string;
  kind?: "consulta" | "exame" | "procedimento";
  durationMinutes: number;
  priceCents?: number;
  paymentMode?: string;
  availabilityId?: string;
  active: boolean;
};

type ReservationRow = {
  _id: string;
  startsAt: number;
  availabilityLabel: string;
  clerkUserId: string;
  status: string;
  notes?: string;
  eventTypeId: string;
  availabilityId: string;
};

type AvailabilityGroup = {
  name: string;
  representativeId: string;
  slots: Array<{ _id: string }>;
};

type AdminEventsManagerProps = {
  eventTypes: EventTypeRow[];
  reservations: ReservationRow[];
  availabilityGroups: AvailabilityGroup[];
  selectedKind: "all" | "consulta" | "exame" | "procedimento";
};

function formatMoney(cents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDateForInput(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeForInput(timestamp: number) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateTime24h(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(timestamp));
}

function EventReservationsDataTable({
  eventType,
  reservations,
}: {
  eventType: EventTypeRow;
  reservations: ReservationRow[];
}) {
  const columns = useMemo<Array<ColumnDef<ReservationRow>>>(
    () => [
      {
        accessorKey: "startsAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Data/Hora" />,
        cell: ({ row }) => (
          <div>
            {formatDateTime24h(row.original.startsAt)}
            <p className="text-xs text-muted-foreground">{row.original.availabilityLabel}</p>
          </div>
        ),
      },
      {
        accessorKey: "clerkUserId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" />,
        cell: ({ row }) => <span className="text-xs">{row.original.clerkUserId}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      },
      {
        id: "notes",
        accessorFn: (row) => row.notes ?? "",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Observação" />,
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.notes ?? "-"}</span>,
      },
      {
        id: "actions",
        enableSorting: false,
        header: "Ações",
        cell: ({ row }) => {
          const reservation = row.original;
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Editar reserva
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Editar reserva</DialogTitle>
                  <DialogDescription>Atualize dados, horário e status da reserva.</DialogDescription>
                </DialogHeader>
                <ActionToastForm
                  action={updateReservationAction}
                  className="grid gap-2"
                  successMessage="Reserva atualizada com sucesso."
                  errorMessage="Não foi possível atualizar a reserva."
                >
                  <input type="hidden" name="reservationId" value={reservation._id} />
                  <input type="hidden" name="eventTypeId" value={eventType._id} />
                  <input type="hidden" name="availabilityId" value={eventType.availabilityId ?? reservation.availabilityId} />
                  <Input name="clerkUserId" defaultValue={reservation.clerkUserId} required />
                  <div className="grid grid-cols-3 gap-2">
                    <Input name="date" type="date" defaultValue={formatDateForInput(reservation.startsAt)} />
                    <Input
                      name="time"
                      type="time"
                      step={300}
                      defaultValue={formatTimeForInput(reservation.startsAt)}
                      aria-label="Horário"
                      title="Use formato 24h (HH:mm)"
                    />
                    <select name="status" className={selectClassName} defaultValue={reservation.status}>
                      <option value="pending">pending</option>
                      <option value="awaiting_patient">awaiting_patient</option>
                      <option value="confirmed">confirmed</option>
                      <option value="in_care">in_care</option>
                      <option value="surgery_planned">surgery_planned</option>
                      <option value="postop_followup">postop_followup</option>
                      <option value="cancelled">cancelled</option>
                      <option value="completed">completed</option>
                      <option value="no_show">no_show</option>
                    </select>
                  </div>
                  <Input name="notes" defaultValue={reservation.notes ?? ""} placeholder="Observação" />
                  <Button size="sm" variant="secondary" type="submit">
                    Salvar reserva
                  </Button>
                </ActionToastForm>
                <ActionToastForm
                  action={deleteReservationAction}
                  successMessage="Reserva excluída com sucesso."
                  errorMessage="Não foi possível excluir a reserva."
                >
                  <input type="hidden" name="reservationId" value={reservation._id} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" type="button">
                        Excluir reserva
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir esta reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação é irreversível e remove a reserva da agenda.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction type="submit">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </ActionToastForm>
              </DialogContent>
            </Dialog>
          );
        },
      },
    ],
    [eventType._id, eventType.availabilityId],
  );

  return (
    <DataTable
      columns={columns}
      data={reservations}
      emptyMessage="Nenhuma reserva vinculada a este evento."
      filterColumnId="clerkUserId"
      filterPlaceholder="Filtrar por usuário..."
    />
  );
}

export function AdminEventsManager({ eventTypes, reservations, availabilityGroups, selectedKind }: AdminEventsManagerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const originHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const reservationsByEventId = useMemo(() => {
    const map = new Map<string, ReservationRow[]>();
    for (const reservation of reservations) {
      const current = map.get(reservation.eventTypeId) ?? [];
      current.push(reservation);
      map.set(reservation.eventTypeId, current);
    }
    return map;
  }, [reservations]);

  const availabilityGroupBySlotId = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of availabilityGroups) {
      for (const slot of group.slots) {
        map.set(String(slot._id), group.name);
      }
    }
    return map;
  }, [availabilityGroups]);

  const columns = useMemo<Array<ColumnDef<EventTypeRow>>>(
    () => [
      {
        id: "event",
        accessorFn: (row) => row.name ?? row.title,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Evento" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name ?? row.original.title}</span>,
      },
      {
        accessorKey: "slug",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
      },
      {
        accessorKey: "kind",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        cell: ({ row }) => {
          const kind = row.original.kind ?? "consulta";
          return <Badge className={kindClassName[kind]}>{kind}</Badge>;
        },
      },
      {
        accessorKey: "durationMinutes",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Duração" />,
        cell: ({ row }) => `${row.original.durationMinutes} min`,
      },
      {
        accessorKey: "priceCents",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Preço" />,
        cell: ({ row }) => formatMoney(row.original.priceCents ?? 0),
      },
      {
        accessorKey: "paymentMode",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pagamento" />,
        cell: ({ row }) => {
          const paymentMode = row.original.paymentMode ?? "booking_fee";
          return (
            <Badge className={paymentModeClassName[paymentMode] ?? ""}>
              {paymentModeLabels[paymentMode] ?? "Taxa de reserva"}
            </Badge>
          );
        },
      },
      {
        id: "availabilityGroup",
        accessorFn: (row) =>
          row.availabilityId ? availabilityGroupBySlotId.get(String(row.availabilityId)) ?? "Sem grupo" : "Sem grupo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Disponibilidade" />,
      },
      {
        accessorKey: "active",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge variant={row.original.active ? "default" : "outline"}>{row.original.active ? "Ativo" : "Inativo"}</Badge>
        ),
      },
      {
        id: "reservationsCount",
        accessorFn: (row) => reservationsByEventId.get(row._id)?.length ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reservas" />,
      },
      {
        id: "actions",
        enableSorting: false,
        header: "Ações",
        cell: ({ row }) => {
          const eventType = row.original;
          const eventReservations = reservationsByEventId.get(eventType._id) ?? [];
          const linkedAvailabilityGroupName = eventType.availabilityId
            ? availabilityGroupBySlotId.get(String(eventType.availabilityId)) ?? "Disponibilidade"
            : "Disponibilidade";

          return (
            <div className="flex min-w-72 flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link
                  href={appendParallelRouteOrigin(
                    selectedKind === "all"
                      ? `/dashboard/admin/eventos/editar/${eventType._id}`
                      : `/dashboard/admin/eventos/editar/${eventType._id}?kind=${selectedKind}`,
                    originHref,
                  )}
                >
                  Editar
                </Link>
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!eventType.availabilityId}>
                    Reservas
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Reservas do evento</DialogTitle>
                    <DialogDescription>Crie novas reservas e gerencie as já vinculadas a este evento.</DialogDescription>
                  </DialogHeader>

                  <ActionToastForm
                    action={createReservationAction}
                    className="grid gap-2 rounded-md border p-2"
                    successMessage="Reserva criada com sucesso."
                    errorMessage="Não foi possível criar a reserva."
                  >
                    <input type="hidden" name="eventTypeId" value={eventType._id} />
                    <input type="hidden" name="availabilityId" value={eventType.availabilityId ?? ""} />
                    <Input name="clerkUserId" placeholder="user_..." required />
                    <div className="grid grid-cols-3 gap-2">
                      <Input name="date" type="date" required />
                      <Input name="time" type="time" step={300} required aria-label="Horário" title="Use formato 24h (HH:mm)" />
                      <select name="status" className={selectClassName} defaultValue="pending">
                        <option value="pending">pending</option>
                        <option value="awaiting_patient">awaiting_patient</option>
                        <option value="confirmed">confirmed</option>
                        <option value="in_care">in_care</option>
                        <option value="surgery_planned">surgery_planned</option>
                        <option value="postop_followup">postop_followup</option>
                        <option value="cancelled">cancelled</option>
                        <option value="completed">completed</option>
                        <option value="no_show">no_show</option>
                      </select>
                    </div>
                    {eventType.availabilityId ? (
                      <p className="text-xs text-muted-foreground">Usando grupo: {linkedAvailabilityGroupName}</p>
                    ) : (
                      <p className="text-xs text-destructive">
                        Vincule uma disponibilidade ao evento para criar reservas.
                      </p>
                    )}
                    <Input name="notes" placeholder="Observação opcional" />
                    <Button size="sm" type="submit" disabled={!eventType.availabilityId}>
                      Salvar reserva
                    </Button>
                  </ActionToastForm>

                  <EventReservationsDataTable
                    eventType={eventType}
                    reservations={eventReservations}
                  />
                </DialogContent>
              </Dialog>

              <ActionToastForm
                action={setEventTypeActiveAction}
                successMessage={eventType.active ? "Evento inativado com sucesso." : "Evento ativado com sucesso."}
                errorMessage="Não foi possível atualizar o status do evento."
              >
                <input type="hidden" name="eventTypeId" value={eventType._id} />
                <input type="hidden" name="active" value={String(!eventType.active)} />
                <Button variant="outline" size="sm" type="submit">
                  {eventType.active ? "Inativar" : "Ativar"}
                </Button>
              </ActionToastForm>

              <ActionToastForm
                action={deleteEventTypeAction}
                successMessage="Evento excluído com sucesso."
                errorMessage="Não foi possível excluir o evento."
              >
                <input type="hidden" name="eventTypeId" value={eventType._id} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" type="button">
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir este evento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação remove o tipo de evento e não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction type="submit">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </ActionToastForm>
            </div>
          );
        },
      },
    ],
    [availabilityGroupBySlotId, originHref, reservationsByEventId, selectedKind],
  );

  return (
    <DataTable
      columns={columns}
      data={eventTypes}
      filterColumnId="event"
      filterPlaceholder="Filtrar por evento ou slug..."
      emptyMessage="Nenhum evento encontrado para os filtros aplicados."
    />
  );
}
