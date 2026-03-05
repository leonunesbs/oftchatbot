import "./globals.css";

import { Geist } from "next/font/google";
import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OFT ChatBot",
  description: "Painel de atendimento com conversas em tempo real para o OFT ChatBot.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable}`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
