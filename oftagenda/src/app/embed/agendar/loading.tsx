import { BookingFormFallback } from "@/components/booking-form-fallback";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";

export default function EmbedAgendarLoading() {
  return (
    <RouteLoadingShell size="md" className="px-0 py-2">
      <BookingFormFallback embedMode />
    </RouteLoadingShell>
  );
}
