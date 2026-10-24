import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { CartProvider } from "@/components/CartProvider";
import { VintageOverlays } from "./components/VintageOverlays";
import { WhatsAppFloat } from "./components/WhatsAppFloat";
import "./globals.css";

const META_PIXEL_ID = "1166707012686010";

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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* Meta's noscript fallback must be a plain pixel image, not next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <CartProvider>
          <VintageOverlays />
          {children}
          <WhatsAppFloat />
        </CartProvider>
      </body>
    </html>
  );
}
