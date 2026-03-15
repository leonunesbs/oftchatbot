import { buildAvailabilityGroups, getAdminSnapshot } from "@/app/dashboard/admin/_lib/admin-dashboard";
import { AdminCreateTimeBlockView } from "@/components/admin-create-time-block-view";

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

export async function renderCreateTimeBlockPage({
  asDrawer,
  searchParams,
}: {
  asDrawer: boolean;
  searchParams?: SearchParamsInput;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminSnapshot();
  const availabilityGroups = buildAvailabilityGroups(data).map((group) => ({
    name: group.name,
    timezone: group.slots[0]?.timezone || "America/Fortaleza",
  }));

  return (
    <AdminCreateTimeBlockView
      availabilityGroups={availabilityGroups}
      initialDate={toSingleValue(resolvedSearchParams.date)}
      initialTime={toSingleValue(resolvedSearchParams.time)}
      asDrawer={asDrawer}
      backHref="/dashboard/admin/agenda"
    />
  );
}
