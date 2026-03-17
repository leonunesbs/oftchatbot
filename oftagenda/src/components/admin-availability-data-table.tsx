"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type AvailabilityGroupRow = {
  name: string;
  representativeId: string;
  linkedEventsCount: number;
  slots: Array<{ timezone?: string }>;
};

type AdminAvailabilityDataTableProps = {
  availabilityGroups: AvailabilityGroupRow[];
};

export function AdminAvailabilityDataTable({ availabilityGroups }: AdminAvailabilityDataTableProps) {
  const columns = useMemo<Array<ColumnDef<AvailabilityGroupRow>>>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Grupo" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: "slots",
        accessorFn: (row) => row.slots.length,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Faixas" />,
        cell: ({ row }) => row.original.slots.length,
      },
      {
        id: "timezone",
        accessorFn: (row) => row.slots[0]?.timezone ?? "",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fuso horário" />,
        cell: ({ row }) => row.original.slots[0]?.timezone ?? "sem fuso horário",
      },
      {
        accessorKey: "linkedEventsCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Eventos vinculados" />,
      },
      {
        id: "actions",
        header: "Ação",
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/dashboard/admin/disponibilidade/${row.original.representativeId}`}>Editar horários</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={availabilityGroups}
      filterColumnId="name"
      filterPlaceholder="Filtrar por grupo..."
      emptyMessage="Nenhuma disponibilidade cadastrada."
    />
  );
}
