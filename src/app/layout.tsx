import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MMC Scheduler - Makati Medical Center Staff Scheduler",
  description: "Healthcare Staff Scheduler for Pulmonary Laboratory Division",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
