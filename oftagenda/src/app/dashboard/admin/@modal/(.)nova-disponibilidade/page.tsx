"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminAvailabilityCreateDialog } from "@/components/admin-availability-create-dialog";
import {
  closeParallelRoute,
  useParallelRouteBackHref,
} from "@/lib/parallel-route-navigation";

export default function AdminAvailabilityCreateModalPage() {
  const router = useRouter();
  const backHref = useParallelRouteBackHref("/dashboard/admin/disponibilidade");
  const [isOpen, setIsOpen] = useState(true);
  const closeRequestedRef = useRef(false);
  const handleCloseDialog = useCallback(() => {
    if (closeRequestedRef.current) {
      return;
    }
    closeRequestedRef.current = true;
    setIsOpen(false);

    window.setTimeout(() => {
      closeParallelRoute(router, "/dashboard/admin/disponibilidade", backHref);
    }, 120);
  }, [backHref, router]);

  return (
    <AdminAvailabilityCreateDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        }
      }}
    />
  );
}
