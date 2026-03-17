import { renderEmptySlotDialogPage } from "@/app/dashboard/admin/agenda/_lib/render-empty-slot-dialog-page";

export default async function AdminAgendaCelulaVaziaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderEmptySlotDialogPage({ asDrawer: false, searchParams });
}
