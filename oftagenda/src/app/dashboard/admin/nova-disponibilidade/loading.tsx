import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminNovaDisponibilidadeLoading() {
  return (
    <RouteLoadingShell size="md">
      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-7 w-52", "h-4 w-full max-w-xl"]}
      >
        <div className="grid gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-28 rounded-md" />
        </div>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
