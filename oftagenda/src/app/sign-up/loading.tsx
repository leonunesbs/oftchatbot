import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignUpLoading() {
  return (
    <RouteLoadingShell size="md" className="flex justify-center">
      <LoadingCardScaffold
        className="w-full"
        headerLines={["h-8 w-36", "h-4 w-full max-w-sm"]}
      >
        <div className="mx-auto w-full max-w-md space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-4 w-44" />
        </div>
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
