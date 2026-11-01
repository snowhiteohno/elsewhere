import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elsewhere — Trips, put into motion",
  description: "Live travel agents discover stays, transport, local experiences, rentals and restaurants worldwide. Build your trip with evidence from real booking websites.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
