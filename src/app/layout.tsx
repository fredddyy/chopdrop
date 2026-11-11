import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/lib/cart";
import { DialogProvider } from "@/components/dialog";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChopDrop — Pool Together, Pay Less",
  description:
    "Join group buys with people nearby and save 15-35%. More people join, everyone pays less. Food, electronics, fashion, groceries — all cheaper together.",
  manifest: "/manifest.json",
  openGraph: {
    title: "ChopDrop — Pool Together, Pay Less",
    description: "Pool orders with people nearby. More people = lower prices for everyone.",
    url: "https://chopdrop-app.vercel.app",
    siteName: "ChopDrop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChopDrop — Pool Together, Pay Less",
    description: "Pool orders with people nearby. More people = lower prices for everyone.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChopDrop",
  },
};

export const viewport: Viewport = {
  themeColor: "#E8604C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <CartProvider><DialogProvider>{children}</DialogProvider></CartProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js")}`,
          }}
        />
      </body>
    </html>
  );
}
