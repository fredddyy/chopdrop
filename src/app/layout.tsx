import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChopDrop — Your Office Eats Better Together",
  description:
    "Order lunch together as an office. ₦0 delivery, everyone picks & pays individually, pool benefits unlock as more people join. Set up in 2 minutes.",
  manifest: "/manifest.json",
  openGraph: {
    title: "ChopDrop — Your Office Eats Better Together",
    description: "Order lunch together as an office. Pool benefits, ₦0 delivery. Set up in 2 min.",
    url: "https://chopdrop-app.vercel.app",
    siteName: "ChopDrop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChopDrop — Your Office Eats Better Together",
    description: "Order lunch together as an office. Pool benefits, ₦0 delivery. Set up in 2 min.",
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
        <CartProvider>{children}</CartProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js")}`,
          }}
        />
      </body>
    </html>
  );
}
