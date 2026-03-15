import { OverlayLoadingDialog } from "@/components/loading/overlay-loading-dialog";

export default function AdminNovaDisponibilidadeModalLoading() {
  return (
    <OverlayLoadingDialog
      titleWidthClassName="w-52"
      descriptionWidthClassName="w-full max-w-sm"
      contentSizeClassName="sm:max-w-xl"
      rows={6}
    />
  );
}
