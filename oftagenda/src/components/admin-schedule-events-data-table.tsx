"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type AppointmentEventRow = {
  _id: string;
  eventType: string;
  createdAt: number;
  clerkUserId: string;
  notes?: string;
};

type AdminScheduleEventsDataTableProps = {
  events: AppointmentEventRow[];
};

function formatDateTime24h(value: number) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));
}

export function AdminScheduleEventsDataTable({ events }: AdminScheduleEventsDataTableProps) {
  const columns = useMemo<Array<ColumnDef<AppointmentEventRow>>>(
    () => [
      {
        accessorKey: "eventType",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Evento" />,
        cell: ({ row }) => (
          <div className="font-medium">
            <Badge variant="outline">{row.original.eventType}</Badge>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Data/Hora" />,
        cell: ({ row }) => formatDateTime24h(row.original.createdAt),
      },
      {
        accessorKey: "clerkUserId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" />,
        cell: ({ row }) => <span className="text-xs">{row.original.clerkUserId}</span>,
      },
      {
        id: "notes",
        accessorFn: (row) => row.notes ?? "",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Observações" />,
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.notes ?? "-"}</span>,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={events}
      filterColumnId="eventType"
      filterPlaceholder="Filtrar por tipo de evento..."
      emptyMessage="Nenhum evento encontrado para os filtros aplicados."
    />
  );
}
