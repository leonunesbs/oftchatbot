import { OverlayLoadingDialog } from "@/components/loading/overlay-loading-dialog";

export default function AdminAgendaDrawerLoading() {
  return (
    <OverlayLoadingDialog
      titleWidthClassName="w-44"
      descriptionWidthClassName="w-full max-w-xs"
      contentSizeClassName="sm:max-w-lg"
      rows={7}
    />
  );
}
