"use client";

import { useRouter } from "next/navigation";

import { AdminAvailabilityCreateDialog } from "@/components/admin-availability-create-dialog";
import {
  closeParallelRoute,
  useParallelRouteBackHref,
} from "@/lib/parallel-route-navigation";

export default function AdminAvailabilityCreatePage() {
  const router = useRouter();
  const backHref = useParallelRouteBackHref("/dashboard/admin/disponibilidade");

  return (
    <AdminAvailabilityCreateDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          closeParallelRoute(router, "/dashboard/admin/disponibilidade", backHref);
        }
      }}
    />
  );
}
