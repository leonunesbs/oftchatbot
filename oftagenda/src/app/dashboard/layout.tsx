import { requireMember } from "@/lib/access";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  await requireMember("/dashboard");
  return (
    <>
      {children}
      {modal}
    </>
  );
}
