import { DetailsForm } from "@/components/details-form";
import { requireConfirmedBooking } from "@/lib/access";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardDetalhesPage() {
  await requireConfirmedBooking("/agendar");

  return (
    <section className="mx-auto w-full max-w-3xl">
      <DetailsForm />
    </section>
  );
}
