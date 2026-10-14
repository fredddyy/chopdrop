import type { Metadata } from "next";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChopDrop — Meals for Your Team, Sorted",
  description:
    "Everyone picks what they want and pays for themselves. We batch the orders and deliver everything together — one smooth drop, zero stress.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
