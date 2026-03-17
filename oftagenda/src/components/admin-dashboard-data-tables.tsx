"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type UpcomingReservationRow = {
  _id: string;
  startsAt: number;
  startsAtFormatted: string;
  eventTypeTitle: string;
  status: string;
  clerkUserId: string;
};

type QuickSectionRow = {
  href: string;
  title: string;
  description: string;
};

type AdminDashboardDataTablesProps = {
  upcomingReservations: UpcomingReservationRow[];
};

export function AdminDashboardDataTables({ upcomingReservations }: AdminDashboardDataTablesProps) {
  const upcomingColumns = useMemo<Array<ColumnDef<UpcomingReservationRow>>>(
    () => [
      {
        accessorKey: "startsAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Horário" />,
        cell: ({ row }) => row.original.startsAtFormatted,
      },
      {
        accessorKey: "eventTypeTitle",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Evento" />,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge variant={row.original.status === "confirmed" ? "default" : "outline"}>{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: "clerkUserId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" />,
        cell: ({ row }) => <span className="text-xs">{row.original.clerkUserId}</span>,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={upcomingColumns}
      data={upcomingReservations}
      filterColumnId="eventTypeTitle"
      filterPlaceholder="Filtrar por evento..."
      emptyMessage="Nenhuma reserva futura encontrada."
    />
  );
}

export function AdminQuickSectionsDataTable({ quickSections }: { quickSections: QuickSectionRow[] }) {
  const sectionsColumns = useMemo<Array<ColumnDef<QuickSectionRow>>>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Seção" />,
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.description}</span>,
      },
      {
        id: "actions",
        header: "Ação",
        enableSorting: false,
        cell: ({ row }) => (
          <Button asChild size="sm">
            <Link href={row.original.href}>Abrir</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={sectionsColumns}
      data={quickSections}
      filterColumnId="title"
      filterPlaceholder="Filtrar seção..."
      emptyMessage="Nenhuma seção encontrada."
    />
  );
}
