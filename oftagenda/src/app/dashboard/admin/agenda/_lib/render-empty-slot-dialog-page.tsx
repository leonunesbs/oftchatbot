import { buildAvailabilityGroups, getAdminSnapshot } from "@/app/dashboard/admin/_lib/admin-dashboard";
import { AdminEmptySlotDialogView } from "@/components/admin-empty-slot-dialog-view";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

function toSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export async function renderEmptySlotDialogPage({
  asDrawer,
  searchParams,
}: {
  asDrawer: boolean;
  searchParams?: SearchParamsInput;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminSnapshot();
  const availabilityGroups = buildAvailabilityGroups(data);

  const appointmentAvailabilityGroups = availabilityGroups.map((group) => ({
    name: group.name,
    representativeId: group.representativeId,
  }));
  const timeBlockAvailabilityGroups = availabilityGroups.map((group) => ({
    name: group.name,
    timezone: group.slots[0]?.timezone || "America/Fortaleza",
  }));
  const eventTypes = data.eventTypes.map((eventType) => ({
    _id: String(eventType._id),
    slug: eventType.slug,
    name: eventType.name,
    title: eventType.title,
    kind: eventType.kind,
    availabilityId: eventType.availabilityId ? String(eventType.availabilityId) : undefined,
    location: eventType.location,
    active: eventType.active,
  }));

  return (
    <AdminEmptySlotDialogView
      eventTypes={eventTypes}
      appointmentAvailabilityGroups={appointmentAvailabilityGroups}
      timeBlockAvailabilityGroups={timeBlockAvailabilityGroups}
      initialDate={toSingleValue(resolvedSearchParams.date)}
      initialTime={toSingleValue(resolvedSearchParams.time)}
      asDrawer={asDrawer}
      backHref="/dashboard/admin/agenda"
    />
  );
}
