import { Skeleton } from "@/components/ui/skeleton";

export function LoadingChipsRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={`loading-chip-${index}`} className="h-8 w-24 rounded-md" />
      ))}
    </div>
  );
}

export function LoadingStatsGrid({
  count = 4,
  columnsClassName = "grid-cols-2 xl:grid-cols-4",
}: {
  count?: number;
  columnsClassName?: string;
}) {
  return (
    <div className={`grid gap-3 ${columnsClassName}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`loading-stat-${index}`} className="rounded-xl border border-border/70 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="size-4 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-8 w-14" />
          <Skeleton className="mt-2 h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

export function LoadingTableBlock({
  headerCount = 5,
  rowCount = 8,
  columnsClassName = "md:grid-cols-5",
}: {
  headerCount?: number;
  rowCount?: number;
  columnsClassName?: string;
}) {
  return (
    <div className="rounded-md border">
      <div className="space-y-2 p-3">
        <div className={`hidden gap-2 md:grid ${columnsClassName}`}>
          {Array.from({ length: headerCount }).map((_, index) => (
            <Skeleton key={`loading-table-head-${index}`} className="h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: rowCount }).map((_, index) => (
          <div key={`loading-table-row-${index}`} className={`grid gap-2 border-t pt-2 ${columnsClassName} md:items-center`}>
            {Array.from({ length: headerCount }).map((__, columnIndex) => (
              <Skeleton
                key={`loading-table-cell-${index}-${columnIndex}`}
                className={columnIndex === headerCount - 1 ? "h-8 w-20 rounded-md" : "h-4 w-full"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
