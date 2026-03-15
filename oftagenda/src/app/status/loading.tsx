import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatusLoading() {
  return (
    <RouteLoadingShell size="lg" className="space-y-6">
      <LoadingCardScaffold headerLines={["h-7 w-72", "h-4 w-full max-w-2xl"]} contentClassName="grid gap-2 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`status-overview-skeleton-${index}`} className="h-5 rounded-md" />
        ))}
      </LoadingCardScaffold>

      <LoadingCardScaffold headerLines={["h-6 w-64", "h-4 w-full max-w-xl"]}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`status-env-skeleton-${index}`} className="space-y-2 rounded-lg border border-border/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
        ))}
      </LoadingCardScaffold>

      <LoadingCardScaffold headerLines={["h-6 w-56", "h-4 w-full max-w-xl"]}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`status-check-skeleton-${index}`} className="space-y-2 rounded-lg border border-border/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
        ))}
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
