import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Upgrade Intelligence Platform",
  description: "Solar customer upgrade intelligence and campaign management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
