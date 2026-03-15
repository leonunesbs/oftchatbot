import { DetailsLoadingContent } from "@/components/loading/details-loading-content";
import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DetalhesLoading() {
  return (
    <RouteLoadingShell size="md" className="space-y-4">
      <LoadingCardScaffold headerLines={["h-7 w-48", "h-4 w-full max-w-xl"]}>
        <DetailsLoadingContent />
      </LoadingCardScaffold>
      <Card className="border-border/70">
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-10 w-56 rounded-md" />
        </CardContent>
      </Card>
    </RouteLoadingShell>
  );
}
