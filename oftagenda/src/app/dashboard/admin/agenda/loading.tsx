import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAgendaLoading() {
  return (
    <RouteLoadingShell size="full" className="space-y-4">
      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-7 w-52", "h-4 w-full max-w-2xl"]}
        contentClassName="space-y-4"
      >
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="h-7 w-44 rounded-full" />
          <Skeleton className="h-7 w-48 rounded-full" />
        </div>
        <Skeleton className="h-[620px] w-full rounded-xl" />
      </LoadingCardScaffold>

      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-6 w-64", "h-4 w-full max-w-lg"]}
        contentClassName="grid gap-2 md:grid-cols-2"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={`admin-agenda-event-${index}`} className="rounded-md border p-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        ))}
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
