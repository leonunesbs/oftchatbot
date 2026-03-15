import { BookingFormFallback } from "@/components/booking-form-fallback";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";

export default function AgendarLoading() {
  return (
    <RouteLoadingShell size="lg">
      <BookingFormFallback />
    </RouteLoadingShell>
  );
}
