import { resolvePreBookingSummary } from "@/lib/pre-booking-summary";
import { auth } from "@clerk/nextjs/server";
import { ResumoDialog } from "./resumo-dialog";

type ResumoInterceptPageProps = {
  searchParams?: Promise<{
    eventType?: string;
    date?: string;
    time?: string;
    payment?: string;
  }>;
};

export default async function ResumoInterceptPage({
  searchParams,
}: ResumoInterceptPageProps) {
  const params = (await searchParams) ?? {};
  const [summary, { userId }] = await Promise.all([
    resolvePreBookingSummary(params),
    auth(),
  ]);

  return (
    <ResumoDialog
      eventType={summary.eventType}
      eventTypeLabel={summary.eventTypeLabel}
      eventTypeAddress={summary.eventTypeAddress}
      consultationPriceCents={summary.consultationPriceCents}
      reservationFeeCents={summary.reservationFeeCents}
      reservationFeePercent={summary.reservationFeePercent}
      paymentMode={summary.paymentMode}
      date={summary.date}
      dateLabel={summary.dateLabel}
      time={summary.time}
      timeLabel={summary.timeLabel}
      payment={summary.payment}
      hasRedactedParams={summary.hasRedactedParams}
      hasInvalidSelection={summary.hasInvalidSelection}
      isAuthenticated={Boolean(userId)}
    />
  );
}
