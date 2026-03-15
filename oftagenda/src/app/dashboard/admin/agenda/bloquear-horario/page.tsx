import { renderCreateTimeBlockPage } from "@/app/dashboard/admin/agenda/_lib/render-create-time-block-page";

export default async function AdminAgendaBloquearHorarioPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderCreateTimeBlockPage({ asDrawer: false, searchParams });
}
