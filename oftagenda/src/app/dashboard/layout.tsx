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
  admin,
  patient,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  admin: React.ReactNode;
  patient: React.ReactNode;
}) {
  await requireMember("/dashboard");
  return (
    <>
      {children}
      {admin}
      {patient}
      {modal}
    </>
  );
}
