import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgendarResumoLoading() {
  return (
    <RouteLoadingShell size="lg" className="flex min-h-[55vh] items-center">
      <LoadingCardScaffold
        className="w-full"
        headerLines={["h-7 w-64", "h-4 w-full max-w-2xl"]}
      >
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="flex w-full flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <Skeleton className="h-10 w-full sm:w-40" />
          <Skeleton className="h-10 w-full sm:w-44" />
        </div>
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
