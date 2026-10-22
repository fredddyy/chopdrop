"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

export function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  const plateLabel = cart.subtotal > 0 ? `₦${(cart.subtotal / 100).toLocaleString()}` : "My Plate";

  const links = [
    { href: "/menu", label: "Pool", icon: "M3 12l9-8 9 8M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10", count: 0 },
    { href: "/cart", label: plateLabel, icon: "M6 7h12l1 14H5L6 7ZM9 9V6a3 3 0 0 1 6 0v3", count: cart.totalItems },
    { href: "/orders", label: "Orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4", count: 0 },
    { href: "/account", label: "Me", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z", count: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl z-50 md:hidden" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-lg mx-auto grid grid-cols-4 py-2 px-4">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-1 py-1 transition-colors ${
                active ? "text-[var(--coral)]" : "text-[var(--text-muted)]"
              }`}
            >
              {active && (
                <span className="absolute -top-2 w-8 h-[3px] rounded-full" style={{ background: "var(--coral)" }} />
              )}
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                fill={active ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={active ? "0" : "1.6"}
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d={link.icon} />
              </svg>
              <span className={`text-[11px] transition-all ${active ? "font-bold" : "font-medium"}`}>
                {link.label}
              </span>
              {link.count > 0 && (
                <span className="absolute -top-0.5 right-1/2 translate-x-4 min-w-[18px] h-[18px] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1" style={{ background: "var(--coral)" }}>
                  {link.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
