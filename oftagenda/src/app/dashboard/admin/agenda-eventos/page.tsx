import { formatDateTime24h, getAdminSnapshot } from "@/app/dashboard/admin/_lib/admin-dashboard";
import { AdminScheduleEventsDataTable } from "@/components/admin-schedule-events-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const periodFilters = ["7d", "30d", "all"] as const;

export default async function AdminScheduleEventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string; type?: string }>;
}) {
  const data = await getAdminSnapshot();
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedPeriod = periodFilters.includes((resolvedSearchParams.period as (typeof periodFilters)[number]) ?? "7d")
    ? ((resolvedSearchParams.period as (typeof periodFilters)[number]) ?? "7d")
    : "7d";
  const selectedType = resolvedSearchParams.type?.trim() || "all";

  const now = Date.now();
  const periodStart =
    selectedPeriod === "7d"
      ? now - 7 * 24 * 60 * 60_000
      : selectedPeriod === "30d"
        ? now - 30 * 24 * 60 * 60_000
        : Number.MIN_SAFE_INTEGER;

  const eventTypes = [...new Set(data.appointmentEvents.map((event) => event.eventType))];
  const filteredEvents = data.appointmentEvents.filter((event) => {
    if (event.createdAt < periodStart) {
      return false;
    }
    if (selectedType === "all") {
      return true;
    }
    return event.eventType === selectedType;
  });

  return (
    <Card variant="flat-mobile" className="border-border/70">
      <CardHeader>
        <CardTitle>Eventos da agenda</CardTitle>
        <CardDescription>Monitore mudanças operacionais por tipo e janela de tempo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {periodFilters.map((period) => (
            <Button key={period} variant={selectedPeriod === period ? "default" : "outline"} size="sm" asChild>
              <Link href={`/dashboard/admin/agenda-eventos?period=${period}&type=${selectedType}`}>
                {period === "all" ? "Todo o período" : period}
              </Link>
            </Button>
          ))}
          <Button variant={selectedType === "all" ? "default" : "outline"} size="sm" asChild>
            <Link href={`/dashboard/admin/agenda-eventos?period=${selectedPeriod}&type=all`}>Todos os tipos</Link>
          </Button>
          {eventTypes.map((eventType) => (
            <Button key={eventType} variant={selectedType === eventType ? "default" : "outline"} size="sm" asChild>
              <Link href={`/dashboard/admin/agenda-eventos?period=${selectedPeriod}&type=${eventType}`}>{eventType}</Link>
            </Button>
          ))}
        </div>
        <AdminScheduleEventsDataTable events={filteredEvents} formatDateTime24h={formatDateTime24h} />
      </CardContent>
    </Card>
  );
}
