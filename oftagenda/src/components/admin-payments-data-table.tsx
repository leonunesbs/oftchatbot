"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { setPaymentStatusAction } from "@/app/dashboard/admin/actions";
import { ActionToastForm } from "@/components/action-toast-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Input } from "@/components/ui/input";

const selectClassName = "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs";

type PaymentRow = {
  _id: string;
  amountCents: number;
  currency: string;
  method: string;
  clerkUserId: string;
  status: "pending" | "paid" | "refunded" | "failed";
  notes?: string;
};

type AdminPaymentsDataTableProps = {
  payments: PaymentRow[];
  formatMoney: (cents: number, currency?: string) => string;
};

export function AdminPaymentsDataTable({ payments, formatMoney }: AdminPaymentsDataTableProps) {
  const columns = useMemo<Array<ColumnDef<PaymentRow>>>(
    () => [
      {
        accessorKey: "amountCents",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
        cell: ({ row }) => <span className="font-medium">{formatMoney(row.original.amountCents, row.original.currency)}</span>,
      },
      {
        accessorKey: "method",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Método" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.method} / {row.original.currency}
          </span>
        ),
      },
      {
        accessorKey: "clerkUserId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" />,
        cell: ({ row }) => <span className="text-xs">{row.original.clerkUserId}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status atual" />,
        cell: ({ row }) => (
          <Badge variant={row.original.status === "paid" ? "default" : "outline"}>{row.original.status}</Badge>
        ),
      },
      {
        id: "actions",
        header: "Atualizar",
        enableSorting: false,
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <ActionToastForm
              action={setPaymentStatusAction}
              className="grid min-w-72 gap-2"
              successMessage="Status do pagamento atualizado com sucesso."
              errorMessage="Não foi possível atualizar o pagamento."
            >
              <input type="hidden" name="paymentId" value={payment._id} />
              <select name="status" className={selectClassName} defaultValue={payment.status}>
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="refunded">refunded</option>
                <option value="failed">failed</option>
              </select>
              <Input name="notes" defaultValue={payment.notes ?? ""} placeholder="Observação" />
              <Button size="sm" type="submit">
                Atualizar
              </Button>
            </ActionToastForm>
          );
        },
      },
    ],
    [formatMoney],
  );

  return (
    <DataTable
      columns={columns}
      data={payments}
      filterColumnId="clerkUserId"
      filterPlaceholder="Filtrar por usuário..."
      emptyMessage="Nenhum pagamento encontrado."
    />
  );
}
