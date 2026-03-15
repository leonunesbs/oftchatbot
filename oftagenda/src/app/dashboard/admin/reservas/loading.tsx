import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { LoadingTableBlock } from "@/components/loading/skeleton-presets";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ReservationsStatsMobile() {
  return (
    <div className="grid grid-cols-2 gap-3 xl:hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={`reservas-stat-mobile-${index}`} variant="flat-mobile" className="border-border/70">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReservationsStatsDesktop() {
  return (
    <div className="hidden gap-3 xl:grid xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={`reservas-stat-desktop-${index}`} variant="flat-mobile" className="border-border/70">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminReservationsLoading() {
  return (
    <RouteLoadingShell size="full" className="space-y-4">
      <ReservationsStatsMobile />
      <ReservationsStatsDesktop />

      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-6 w-56", "h-4 w-full max-w-xl"]}
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-14" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`reservas-status-chip-${index}`} className="h-8 w-24 rounded-md" />
            ))}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
          <div className="self-end">
            <Skeleton className="h-9 w-48" />
          </div>
        </div>

        <LoadingTableBlock />

        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-44" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="hidden h-8 w-24 md:block" />
          </div>
        </div>
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
