"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

export function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  const links = [
    { href: "/menu", label: "Today's", icon: "M3 11l9-8 9 8M5 10v10h14V10M9 20v-6h6v6", count: 0 },
    { href: "/cart", label: "Your", icon: "M6 7h12l1 14H5L6 7ZM9 9V6a3 3 0 0 1 6 0v3", count: cart.totalItems },
    { href: "/orders", label: "Orders", icon: "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6", count: 0 },
    { href: "/account", label: "Account", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0", count: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-paper border-t border-line z-50 md:hidden">
      <div className="max-w-lg mx-auto grid grid-cols-4 py-1.5 px-2">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/") ||
            (link.href === "/menu" && pathname === "/menu");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[9px] font-semibold transition-colors ${
                active ? "text-green bg-green-soft" : "text-ink-soft"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={link.icon} />
              </svg>
              {link.label}
              {link.count > 0 && (
                <span className="absolute -top-0.5 right-2 min-w-[16px] h-[16px] bg-coral text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {link.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
