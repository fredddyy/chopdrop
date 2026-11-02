"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

function formatNaira(kobo: number): string { return "₦" + (kobo / 100).toLocaleString(); }

export function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();

  const links = [
    { href: "/discover", label: "Discover", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", match: ["/discover", "/menu", "/product"], count: 0 },
    { href: "/pools", label: "Pools", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", count: 0 },
    { href: "/cart", label: cart.totalItems > 0 ? formatNaira(cart.subtotal) : "Cart", icon: "M6 7h12l1 14H5L6 7ZM9 9V6a3 3 0 0 1 6 0v3", count: cart.totalItems },
    { href: "/account", label: "Me", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z", count: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ background: "rgba(249,250,251,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-lg mx-auto grid grid-cols-4 py-2 px-4">
        {links.map((link) => {
          const active = link.match
            ? link.match.some(m => pathname === m || pathname.startsWith(m + "/"))
            : pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className="relative flex flex-col items-center gap-1 py-1 transition-colors"
              style={{ color: active ? "var(--text)" : "var(--text-muted)" }}
            >
              {active && (
                <span className="absolute -top-2 w-6 h-[2px] rounded-full" style={{ background: "var(--coral)" }} />
              )}
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                fill={active ? "var(--coral)" : "none"}
                stroke={active ? "var(--coral)" : "currentColor"}
                strokeWidth={active ? "0" : "1.6"}
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d={link.icon} />
              </svg>
              <span className={`text-[11px] ${active ? "font-bold" : "font-medium"}`}>
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
