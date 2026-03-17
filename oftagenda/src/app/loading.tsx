import { BookingFormFallback } from "@/components/booking-form-fallback";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const featureCards = 3;

export default function Loading() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 pt-4 md:gap-8 md:pt-8"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,rgba(120,148,255,0.18),transparent_58%)] blur-2xl" />

      <section>
        <Card className="relative overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-primary/5 via-card/95 to-card/75 backdrop-blur-2xl">
          <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          <CardHeader className="relative space-y-4">
            <Skeleton className="h-6 w-72 rounded-full" />
            <Skeleton className="h-10 w-56 md:h-14 md:w-72" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-4/5 max-w-xl" />
          </CardHeader>
          <CardContent className="relative flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-3 w-full max-w-xl" />
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {Array.from({ length: featureCards }).map((_, index) => (
            <Card key={`loading-feature-${index}`} className="rounded-2xl border-border/70">
              <CardHeader className="space-y-2 pb-3">
                <Skeleton className="h-5 w-52" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card className="rounded-2xl border-border/70">
          <CardHeader className="space-y-2">
            <Skeleton className="h-7 w-80 max-w-full" />
            <Skeleton className="h-4 w-full max-w-3xl" />
            <Skeleton className="h-4 w-2/3 max-w-xl" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-52 rounded-md" />
            <Skeleton className="h-10 w-52 rounded-md" />
          </CardContent>
        </Card>
      </section>

      <section className="scroll-mt-24">
        <div className="mx-auto w-full max-w-5xl space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="mx-auto mt-4 w-full max-w-5xl">
          <BookingFormFallback />
        </div>
      </section>

      <section>
        <Card className="rounded-2xl border-border/70">
          <CardHeader className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-full max-w-3xl" />
            <Skeleton className="h-4 w-3/4 max-w-2xl" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-60 rounded-md" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
