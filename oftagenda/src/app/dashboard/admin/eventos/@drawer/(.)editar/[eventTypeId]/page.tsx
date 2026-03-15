import { renderEventTypeEditPage } from "@/app/dashboard/admin/eventos/_lib/render-event-type-edit-page";

export default async function AdminEventosEditarDrawerPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventTypeId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventTypeId } = await params;
  return renderEventTypeEditPage({ eventTypeId, asDrawer: true, searchParams });
}
