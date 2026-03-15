import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { LoadingTableBlock } from "@/components/loading/skeleton-presets";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAgendaEventosLoading() {
  return (
    <RouteLoadingShell size="full">
      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-7 w-48", "h-4 w-full max-w-xl"]}
      >
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`agenda-event-filter-${index}`} className="h-8 w-24 rounded-md" />
          ))}
        </div>
        <LoadingTableBlock headerCount={4} rowCount={8} columnsClassName="md:grid-cols-4" />
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
