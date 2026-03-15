import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { LoadingTableBlock } from "@/components/loading/skeleton-presets";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <RouteLoadingShell size="full" className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={`admin-filter-skeleton-${index}`} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-7 w-56", "h-4 w-full max-w-xl"]}
        contentClassName="space-y-5"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`admin-kpi-skeleton-${index}`} className="rounded-xl border p-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-3 h-8 w-24" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          ))}
        </div>
      </LoadingCardScaffold>

      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-6 w-52", "h-4 w-full max-w-lg"]}
      >
        <LoadingTableBlock headerCount={5} rowCount={7} />
      </LoadingCardScaffold>

      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-6 w-44", "h-4 w-full max-w-md"]}
      >
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`admin-quick-action-skeleton-${index}`} className="h-16 rounded-md" />
          ))}
        </div>
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
