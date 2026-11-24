"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Package, ShoppingCart, Users2, UserCircle, Settings, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, match: ["/admin"] },
  { href: "/admin/stores", label: "Stores", icon: Store, match: ["/admin/stores"] },
  { href: "/admin/products", label: "Products", icon: Package, match: ["/admin/products"] },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, match: ["/admin/orders"] },
  { href: "/admin/pools", label: "Pools", icon: Users2, match: ["/admin/pools"] },
  { href: "/admin/users", label: "Users", icon: UserCircle, match: ["/admin/users"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, match: ["/admin/settings"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen flex" style={{ background: "#FAF9F7" }}>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:flex-col md:w-[220px] md:shrink-0 border-r" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Link href="/admin">
            <h1 className="text-[20px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
              Chop<span style={{ color: "#E84C3D" }}>Drop</span>
            </h1>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "#9CA3AF" }}>Admin Console</p>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => {
            const active = item.match.some(m => m === "/admin" ? pathname === "/admin" : pathname.startsWith(m));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold"
                style={{
                  background: active ? "rgba(232,76,61,0.08)" : "transparent",
                  color: active ? "#E84C3D" : "#6B7280",
                }}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5">
          <button type="button" onClick={() => {
            document.cookie = "chopdrop-admin-token=; path=/; max-age=0";
            window.location.href = "/admin/login";
          }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold w-full"
            style={{ color: "#9CA3AF" }}>
            <LogOut size={18} strokeWidth={1.8} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen pb-20 md:pb-6">
        {/* Mobile header */}
        <div className="md:hidden px-5 pt-5 pb-3 flex items-center justify-between" style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}>
          <h1 className="text-[18px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
            Chop<span style={{ color: "#E84C3D" }}>Drop</span>
          </h1>
          <button type="button" onClick={() => {
            document.cookie = "chopdrop-admin-token=; path=/; max-age=0";
            window.location.href = "/admin/login";
          }}
            className="text-[11px] font-bold" style={{ color: "#9CA3AF" }}>
            Log out
          </button>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 py-2" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderTop: "1px solid #E5E7EB" }}>
        {NAV.slice(0, 4).map(item => {
          const active = item.match.some(m => m === "/admin" ? pathname === "/admin" : pathname.startsWith(m));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 py-1">
              <Icon size={20} strokeWidth={active ? 2.2 : 1.6} style={{ color: active ? "#E84C3D" : "#9CA3AF" }} />
              <span className="text-[9px] font-bold" style={{ color: active ? "#E84C3D" : "#9CA3AF" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
