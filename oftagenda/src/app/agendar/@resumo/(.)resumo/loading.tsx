import { OverlayLoadingDialog } from "@/components/loading/overlay-loading-dialog";

export default function AgendarResumoInterceptLoading() {
  return (
    <OverlayLoadingDialog
      titleWidthClassName="w-64"
      descriptionWidthClassName="w-full max-w-sm"
      contentSizeClassName="sm:max-w-lg"
      rows={3}
    />
  );
}
