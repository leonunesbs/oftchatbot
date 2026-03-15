"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type OverlayLoadingDialogProps = {
  titleWidthClassName?: string;
  descriptionWidthClassName?: string;
  contentSizeClassName?: string;
  rows?: number;
};

export function OverlayLoadingDialog({
  titleWidthClassName = "w-56",
  descriptionWidthClassName = "w-full max-w-xs",
  contentSizeClassName = "sm:max-w-lg",
  rows = 5,
}: OverlayLoadingDialogProps) {
  return (
    <Dialog open>
      <DialogContent className={`max-h-[90vh] w-full overflow-y-auto ${contentSizeClassName}`}>
        <DialogHeader>
          <DialogTitle>
            <Skeleton className={`h-6 ${titleWidthClassName}`} />
          </DialogTitle>
          <DialogDescription>
            <Skeleton className={`h-4 ${descriptionWidthClassName}`} />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={`overlay-loading-row-${index}`} className="h-10 rounded-md" />
          ))}
          <Skeleton className="h-28 rounded-md" />
          <div className="flex justify-end gap-2 pt-1">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
