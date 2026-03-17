"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { linkWhatsappToUserAction } from "@/app/dashboard/admin/actions";
import { ActionToastForm } from "@/components/action-toast-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Input } from "@/components/ui/input";

type AdminUserRow = {
  name?: string;
  clerkUserId: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  reservationsCount: number;
  appointmentsCount: number;
  paymentsCount: number;
  paidAmountCents: number;
};

type AdminUsersDataTableProps = {
  users: AdminUserRow[];
  formatMoney: (cents: number) => string;
};

function formatWhatsapp(value?: string) {
  if (!value) {
    return "não vinculado";
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const partA = digits.slice(4, 9);
    const partB = digits.slice(9);
    return `+55 (${ddd}) ${partA}-${partB}`;
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const partA = digits.slice(4, 8);
    const partB = digits.slice(8);
    return `+55 (${ddd}) ${partA}-${partB}`;
  }
  return value;
}

export function AdminUsersDataTable({ users, formatMoney }: AdminUsersDataTableProps) {
  const columns = useMemo<Array<ColumnDef<AdminUserRow>>>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name ?? "Sem nome"}</span>,
      },
      {
        accessorKey: "clerkUserId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Clerk ID" />,
        cell: ({ row }) => <span className="text-xs">{row.original.clerkUserId}</span>,
      },
      {
        id: "contato",
        accessorFn: (row) => `${row.email ?? ""} ${row.phone ?? ""}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contato" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.email ?? "sem e-mail"} / {row.original.phone ?? "sem telefone"}
          </span>
        ),
      },
      {
        accessorKey: "whatsapp",
        header: ({ column }) => <DataTableColumnHeader column={column} title="WhatsApp vinculado" />,
        cell: ({ row }) => <span className="text-xs">{formatWhatsapp(row.original.whatsapp)}</span>,
      },
      {
        accessorKey: "reservationsCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reservas" />,
      },
      {
        accessorKey: "appointmentsCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Agendamentos" />,
      },
      {
        accessorKey: "paymentsCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pagamentos" />,
      },
      {
        accessorKey: "paidAmountCents",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Valor pago" />,
        cell: ({ row }) => formatMoney(row.original.paidAmountCents),
      },
      {
        id: "actions",
        enableSorting: false,
        header: "Vincular WhatsApp",
        cell: ({ row }) => (
          <ActionToastForm
            action={linkWhatsappToUserAction}
            className="flex min-w-72 items-center gap-2"
            successMessage="WhatsApp vinculado com sucesso."
            errorMessage="Não foi possível vincular o WhatsApp."
          >
            <input type="hidden" name="clerkUserId" value={row.original.clerkUserId} />
            <Input name="phone" placeholder="(85) 99999-9999 ou 5585999999999" className="h-8 text-xs" />
            <Button type="submit" size="sm">
              Vincular
            </Button>
          </ActionToastForm>
        ),
      },
    ],
    [formatMoney],
  );

  return (
    <DataTable
      columns={columns}
      data={users}
      filterColumnId="name"
      filterPlaceholder="Filtrar por nome, e-mail ou telefone..."
      emptyMessage="Nenhum usuário encontrado."
    />
  );
}
