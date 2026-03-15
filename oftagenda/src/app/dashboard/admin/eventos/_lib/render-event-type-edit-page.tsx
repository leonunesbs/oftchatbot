import Link from "next/link";
import {
  buildAvailabilityGroups,
  getAdminSnapshot,
} from "@/app/dashboard/admin/_lib/admin-dashboard";
import { AdminEventTypeEditorView } from "@/components/admin-event-type-editor-view";
import { Button } from "@/components/ui/button";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

const kindFilters = ["all", "consulta", "exame", "procedimento"] as const;

function toSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export async function renderEventTypeEditPage({
  eventTypeId,
  asDrawer,
  searchParams,
}: {
  eventTypeId: string;
  asDrawer: boolean;
  searchParams?: SearchParamsInput;
}) {
  const data = await getAdminSnapshot();
  const availabilityGroups = buildAvailabilityGroups(data);
  const eventType = data.eventTypes.find((item) => String(item._id) === eventTypeId);
  const resolvedSearchParams = (await searchParams) ?? {};
  const kindValue = toSingleValue(resolvedSearchParams.kind);
  const selectedKind = kindFilters.includes((kindValue as (typeof kindFilters)[number]) ?? "all")
    ? ((kindValue as (typeof kindFilters)[number]) ?? "all")
    : "all";
  const backHref =
    selectedKind === "all" ? "/dashboard/admin/eventos" : `/dashboard/admin/eventos?kind=${selectedKind}`;

  if (!eventType) {
    if (asDrawer) {
      return null;
    }
    return (
      <section className="mx-auto w-full max-w-4xl space-y-4 max-md:max-w-none max-md:px-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">Evento não encontrado</h1>
          <Button asChild variant="outline" size="sm">
            <Link href={backHref}>Voltar</Link>
          </Button>
        </div>
      </section>
    );
  }

  const linkedAvailabilityGroup =
    eventType.availabilityId
      ? availabilityGroups.find((group) =>
          group.slots.some((slot) => String(slot._id) === String(eventType.availabilityId)),
        ) ?? null
      : null;

  const defaultAvailabilityId = eventType.availabilityId
    ? (availabilityGroups.find((group) =>
        group.slots.some((slot) => String(slot._id) === String(eventType.availabilityId)),
      )?.representativeId ??
      String(eventType.availabilityId))
    : "";

  return (
    <AdminEventTypeEditorView
      asDrawer={asDrawer}
      backHref={backHref}
      availabilityGroups={availabilityGroups}
      linkedAvailabilityGroup={linkedAvailabilityGroup}
      eventType={{
        _id: String(eventType._id),
        slug: eventType.slug,
        name: eventType.name ?? eventType.title,
        address: eventType.address ?? "",
        notes: eventType.notes ?? eventType.description ?? "",
        durationMinutes: eventType.durationMinutes,
        priceReais: ((eventType.priceCents ?? 0) / 100).toFixed(2),
        kind: eventType.kind ?? "consulta",
        paymentMode: eventType.paymentMode ?? "booking_fee",
        availabilityId: defaultAvailabilityId,
        location: eventType.location,
        active: eventType.active,
      }}
    />
  );
}
