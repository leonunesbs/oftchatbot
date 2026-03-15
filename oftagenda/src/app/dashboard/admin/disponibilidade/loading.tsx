import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { LoadingTableBlock } from "@/components/loading/skeleton-presets";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDisponibilidadeLoading() {
  return (
    <RouteLoadingShell size="full">
      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-7 w-44", "h-4 w-full max-w-xl"]}
      >
        <div className="flex justify-end">
          <Skeleton className="h-9 w-44" />
        </div>
        <LoadingTableBlock headerCount={5} rowCount={6} />
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
