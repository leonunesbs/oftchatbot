"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
};

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const pageCount = table.getPageCount();
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const filteredRowsCount = table.getFilteredRowModel().rows.length;
  const currentPage = Math.min(table.getState().pagination.pageIndex + 1, Math.max(pageCount, 1));
  const totalPages = Math.max(pageCount, 1);
  const pageSize = String(table.getState().pagination.pageSize);

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-muted-foreground sm:text-sm">
        {selectedRowsCount > 0
          ? `${selectedRowsCount} de ${filteredRowsCount} linha(s) selecionada(s).`
          : `${filteredRowsCount} resultado(s).`}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">Linhas</p>
          <Select
            value={pageSize}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="h-8 w-[72px] border-0 bg-transparent px-1 shadow-none focus-visible:ring-0">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[112px] text-center text-xs font-medium sm:text-sm">
          Página {currentPage} de {totalPages}
        </div>

        <div className="flex items-center gap-1 rounded-md border bg-background p-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden md:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Primeira página</span>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Página anterior</span>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Próxima página</span>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden md:flex"
            onClick={() => table.setPageIndex(Math.max(pageCount - 1, 0))}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Última página</span>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
