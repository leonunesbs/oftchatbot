import { OverlayLoadingDialog } from "@/components/loading/overlay-loading-dialog";

export default function AdminEventosDrawerLoading() {
  return (
    <OverlayLoadingDialog
      titleWidthClassName="w-36"
      descriptionWidthClassName="w-full max-w-sm"
      contentSizeClassName="sm:max-w-2xl"
      rows={9}
    />
  );
}
