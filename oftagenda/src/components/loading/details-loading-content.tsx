import { Skeleton } from "@/components/ui/skeleton";

export function DetailsLoadingContent() {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 rounded-md" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 rounded-md" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-28 rounded-md" />
      </div>
      <div className="rounded-xl border border-border/70 p-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-10 w-44 rounded-md" />
    </div>
  );
}
