import type { Metadata, Viewport } from "next";
import { VintageOverlays } from "./components/VintageOverlays";
import { WhatsAppFloat } from "./components/WhatsAppFloat";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0908",
};

export const metadata: Metadata = {
  title: "CultScribe — Where Legends Live Forever",
  description:
    "Stationery inspired by rock and metal. Raw. Real. Written. Notebooks that honor music history—write boldly, think freely.",
  openGraph: {
    title: "CultScribe",
    description: "Where Legends Live Forever. Raw. Real. Written.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <VintageOverlays />
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
