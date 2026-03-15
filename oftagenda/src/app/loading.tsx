import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemedLoadingShell } from "@/components/themed-loading-shell";

export default function Loading() {
  return (
    <ThemedLoadingShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 pt-6 md:pt-10">
        <Card className="rounded-3xl border-white/10 bg-linear-to-br from-card/95 via-card/90 to-card/65 backdrop-blur-2xl">
          <CardHeader className="space-y-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-10 w-60" />
            <Skeleton className="h-5 w-full max-w-2xl" />
            <Skeleton className="h-5 w-3/4 max-w-xl" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
              <div className="grid gap-4 xl:grid-cols-[minmax(20rem,22rem)_minmax(0,1fr)]">
                <Skeleton className="h-[320px] rounded-3xl" />
                <Skeleton className="h-[320px] rounded-3xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </ThemedLoadingShell>
  );
}
