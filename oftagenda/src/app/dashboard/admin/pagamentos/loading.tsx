import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { LoadingTableBlock } from "@/components/loading/skeleton-presets";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPagamentosLoading() {
  return (
    <RouteLoadingShell size="full">
      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-7 w-36", "h-4 w-full max-w-xl"]}
      >
        <Skeleton className="h-10 w-44 rounded-md" />
        <LoadingTableBlock headerCount={5} rowCount={8} />
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
