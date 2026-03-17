import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
        <Card
          variant="flat-mobile"
          className="border-border/70 max-md:overflow-visible"
        >
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full max-w-2xl" />
            <Skeleton className="h-4 w-full max-w-3xl" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 max-md:gap-0 max-md:divide-y max-md:divide-border/60 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-border p-4 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 max-md:py-5">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-48 rounded-md" />
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 max-md:py-5">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-4 w-full max-w-sm" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md sm:col-span-2" />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 max-md:py-5">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-10 w-60 rounded-md" />
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 max-md:py-5">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-10 w-52 rounded-md" />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border p-4">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-full max-w-lg" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </CardContent>
        </Card>
    </section>
  );
}
