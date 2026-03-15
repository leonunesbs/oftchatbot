import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignInLoading() {
  return (
    <RouteLoadingShell size="lg" className="relative flex justify-center pt-2 md:pt-6">
      <LoadingCardScaffold
        className="w-full max-w-4xl rounded-3xl border-white/10 bg-linear-to-br from-card/95 via-card/90 to-card/65 backdrop-blur-2xl"
        headerLines={["h-4 w-48", "h-10 w-36", "h-4 w-full max-w-2xl"]}
        contentClassName="pb-8"
      >
        <div className="mx-auto w-full max-w-xl space-y-3 rounded-2xl border border-border/70 bg-background/90 p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-4 w-44" />
        </div>
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
