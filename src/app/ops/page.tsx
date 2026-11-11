"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/utils";

/* ── Types ── */
interface MetricsData {
  today: {
    orders: number;
    ordersYesterday: number;
    ordersDelta: number;
    grossRevenue: number;
    repeatRate: number;
    repeatUsers: number;
    failedPayments: number;
    pendingPayments: number;
  };
  week: {
    orders: number;
    prevWeekOrders: number;
    ordersDelta: number;
    newUsers: number;
    prevWeekNewUsers: number;
  };
  platform: {
    totalUsers: number;
    totalGangs: number;
    activeGangs: number;
    activePools: number;
    activeFlashDeals: number;
    avgGroupSize: number;
    prevAvgGroupSize: number;
  };
  creditLiability: number;
  channelBreakdown: {
    legacy: number;
    groupOrders: number;
    pools: number;
    instant: number;
  };
  restaurantBreakdown: RestaurantRow[];
}

interface RestaurantRow {
  id: string;
  name: string;
  imageUrl: string | null;
  weekOrders: number;
  prevWeekOrders: number;
  ordersDelta: number;
  weekRevenue: number;
  uniqueCustomers: number;
  groupOrders: number;
}

interface RecentOrder {
  id: string;
  orderCode: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
}

const HEADING_FONT = "'Bricolage Grotesque', system-ui, sans-serif";

/* ── Delta badge ── */
function DeltaBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value === 0) {
    return <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#9CA3AF]">0{suffix}</span>;
  }
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? "text-[#22C55E]" : "text-[#DC2626]"}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={positive ? "" : "rotate-180"}>
        <polyline points="18 15 12 9 6 15" />
      </svg>
      {positive ? "+" : ""}{value}{suffix}
    </span>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, sub, delta, deltaSuffix }: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  deltaSuffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
      <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-[28px] font-bold text-[#1C1C1E] mt-1 leading-none" style={{ fontFamily: HEADING_FONT, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta !== undefined && <DeltaBadge value={delta} suffix={deltaSuffix} />}
        {sub && <span className="text-[11px] text-[#9CA3AF]">{sub}</span>}
      </div>
    </div>
  );
}

/* ── Mini bar chart ── */
function MiniBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-[#6B7280] w-24 shrink-0 truncate">{item.label}</span>
          <div className="flex-1 h-5 bg-[#F3F4F6] rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%`, backgroundColor: item.color }}
            />
          </div>
          <span className="text-xs font-medium text-[#1C1C1E] w-8 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Restaurant avatar ── */
function RestaurantAvatar({ name, imageUrl, size = 32 }: { name: string; imageUrl: string | null; size?: number }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const colors = ["#C4572A", "#1A7D4B", "#D4A24E", "#6366F1", "#EC4899", "#0EA5E9"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: colors[idx] + "18" }}
    >
      <span className="text-xs font-bold" style={{ color: colors[idx] }}>{name.charAt(0)}</span>
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-[#FEF2F0] text-[#E84C3D]",
    PREPARING: "bg-[#FEF9C3] text-[#A16207]",
    READY: "bg-[#F0FDF4] text-[#22C55E]",
    DELIVERED: "bg-[#F0FDF4] text-[#16A34A]",
    CANCELLED: "bg-[#FEF2F2] text-[#DC2626]",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${styles[status] || "bg-[#F3F4F6] text-[#6B7280]"}`}>
      {status}
    </span>
  );
}

/* ── Time formatter ── */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const mins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

/* ══════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════ */

export default function OpsOverviewPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [metricsRes, ordersRes] = await Promise.all([
          fetch("/api/admin/dashboard/metrics"),
          fetch("/api/admin/orders?date=" + new Date().toISOString().split("T")[0]),
        ]);

        const metricsData = await metricsRes.json();
        const ordersData = await ordersRes.json();

        if (metricsData.success && metricsData.data) setMetrics(metricsData.data);
        if (ordersData.success && ordersData.data) {
          setRecentOrders(ordersData.data.filter((o: RecentOrder) => o.paymentStatus === "SUCCESS").slice(0, 8));
        }
        setLastUpdated(new Date());
      } catch {
        /* Auth failures handled by layout */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const t = metrics?.today;
  const w = metrics?.week;
  const p = metrics?.platform;
  const ch = metrics?.channelBreakdown;
  const restaurants = metrics?.restaurantBreakdown || [];

  const channelItems = ch ? [
    { label: "Group Orders", value: ch.groupOrders, color: "#C4572A" },
    { label: "Pools", value: ch.pools, color: "#1A7D4B" },
    { label: "Instant", value: ch.instant, color: "#D4A24E" },
    { label: "Legacy Menu", value: ch.legacy, color: "#6B7280" },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1E]" style={{ fontFamily: HEADING_FONT }}>
            Dashboard
          </h1>
          {lastUpdated && (
            <p className="text-xs text-[#9CA3AF] mt-1">
              Updated {lastUpdated.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <Link
          href="/ops/flash-deals"
          className="text-xs font-medium text-[#E84C3D] hover:underline"
        >
          Flash Deals
        </Link>
      </div>

      {/* ── Top stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Orders"
          value={String(t?.orders ?? 0)}
          delta={t?.ordersDelta}
          sub="vs yesterday"
        />
        <StatCard
          label="Revenue Today"
          value={formatNaira(t?.grossRevenue ?? 0)}
          delta={t?.ordersDelta}
          deltaSuffix=" orders"
          sub="all channels"
        />
        <StatCard
          label="This Week"
          value={String(w?.orders ?? 0)}
          delta={w?.ordersDelta}
          deltaSuffix=" orders"
          sub="vs last week"
        />
        <StatCard
          label="New Users"
          value={String(w?.newUsers ?? 0)}
          delta={(w?.newUsers ?? 0) - (w?.prevWeekNewUsers ?? 0)}
          sub="this week"
        />
      </div>

      {/* ── Platform health row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3">
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Total Users</p>
          <p className="text-xl font-bold text-[#1C1C1E] mt-0.5" style={{ fontFamily: HEADING_FONT }}>{p?.totalUsers ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3">
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Repeat Rate</p>
          <p className="text-xl font-bold text-[#1C1C1E] mt-0.5" style={{ fontFamily: HEADING_FONT }}>{t?.repeatRate ?? 0}%</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3">
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Avg Group Size</p>
          <p className="text-xl font-bold text-[#1C1C1E] mt-0.5" style={{ fontFamily: HEADING_FONT }}>
            {p?.avgGroupSize ?? 0}
            {p && p.prevAvgGroupSize > 0 && (
              <span className="text-xs font-normal text-[#9CA3AF] ml-1">
                (was {p.prevAvgGroupSize})
              </span>
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3">
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Active Gangs</p>
          <p className="text-xl font-bold text-[#1C1C1E] mt-0.5" style={{ fontFamily: HEADING_FONT }}>
            {p?.activeGangs ?? 0}
            <span className="text-xs font-normal text-[#9CA3AF] ml-1">/ {p?.totalGangs ?? 0}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3">
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Active Pools</p>
          <p className="text-xl font-bold text-[#1C1C1E] mt-0.5" style={{ fontFamily: HEADING_FONT }}>{p?.activePools ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3">
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Credit Liability</p>
          <p className="text-xl font-bold text-[#DC2626] mt-0.5" style={{ fontFamily: HEADING_FONT }}>{formatNaira(metrics?.creditLiability ?? 0)}</p>
        </div>
      </div>

      {/* ── Two column: Channel breakdown + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Channel breakdown */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
          <h2 className="text-sm font-semibold text-[#1C1C1E] mb-4" style={{ fontFamily: HEADING_FONT }}>
            Orders by Channel
            <span className="text-xs font-normal text-[#9CA3AF] ml-2">this week</span>
          </h2>
          <MiniBar items={channelItems} />
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
          <h2 className="text-sm font-semibold text-[#1C1C1E] mb-4" style={{ fontFamily: HEADING_FONT }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Orders", href: "/ops/orders", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" },
              { label: "Products", href: "/ops/products", icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" },
              { label: "Restaurants", href: "/ops/restaurants", icon: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" },
              { label: "Pools", href: "/ops/pools", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" },
            ].map(a => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#F8F8F6] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FEF2F0] flex items-center justify-center text-[#E84C3D]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={a.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#1C1C1E]">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Restaurant breakdown table ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] mb-8">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1C1C1E]" style={{ fontFamily: HEADING_FONT }}>
            Restaurant Performance
            <span className="text-xs font-normal text-[#9CA3AF] ml-2">this week</span>
          </h2>
          <Link href="/ops/restaurants" className="text-xs font-medium text-[#E84C3D] hover:underline">
            Manage
          </Link>
        </div>

        {restaurants.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#9CA3AF]">No restaurant activity this week</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Restaurant</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Orders</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide hidden sm:table-cell">Trend</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Revenue</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide hidden md:table-cell">Customers</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide hidden lg:table-cell">Group Orders</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F8F8F6] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <RestaurantAvatar name={r.name} imageUrl={r.imageUrl} />
                        <span className="font-medium text-[#1C1C1E] truncate max-w-[160px]">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#1C1C1E]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {r.weekOrders}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <DeltaBadge value={r.ordersDelta} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[#1C1C1E]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatNaira(r.weekRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#6B7280] hidden md:table-cell" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {r.uniqueCustomers}
                    </td>
                    <td className="px-5 py-3 text-right text-[#6B7280] hidden lg:table-cell" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {r.groupOrders}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent orders ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB]">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1C1C1E]" style={{ fontFamily: HEADING_FONT }}>Recent Orders</h2>
          <Link href="/ops/orders" className="text-xs font-medium text-[#E84C3D] hover:underline">View all</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#9CA3AF]">No orders today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Order</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F8F8F6] transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-[#1C1C1E]">{order.orderCode}</span>
                    </td>
                    <td className="px-5 py-3 text-[#1C1C1E]">{order.customerName}</td>
                    <td className="px-5 py-3 font-medium text-[#1C1C1E]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatNaira(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-right text-xs text-[#9CA3AF]">{timeAgo(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
