import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { LoadingTableBlock } from "@/components/loading/skeleton-presets";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminEventosLoading() {
  return (
    <RouteLoadingShell size="full">
      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-7 w-36", "h-4 w-full max-w-xl"]}
      >
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`event-kind-filter-${index}`} className="h-8 w-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-10 w-44 rounded-md" />
        <LoadingTableBlock headerCount={10} rowCount={8} columnsClassName="md:grid-cols-5 xl:grid-cols-10" />
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
