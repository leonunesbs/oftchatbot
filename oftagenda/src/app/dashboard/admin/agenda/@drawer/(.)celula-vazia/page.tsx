import { renderEmptySlotDialogPage } from "@/app/dashboard/admin/agenda/_lib/render-empty-slot-dialog-page";

export default async function AdminAgendaCelulaVaziaDrawerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderEmptySlotDialogPage({ asDrawer: true, searchParams });
}
