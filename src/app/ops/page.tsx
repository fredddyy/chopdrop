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
    serviceChargeRevenue: number;
    discountCost: number;
    netMargin: number;
    activeOffices: number;
    totalOffices: number;
    activeOfficesYesterday: number;
    avgPoolSize: number;
    repeatRate: number;
    repeatUsers: number;
    totalUsersYesterday: number;
    failedPayments: number;
    pendingPayments: number;
  };
  week: {
    orders: number;
    prevWeekOrders: number;
    ordersDelta: number;
    newUsers: number;
    newOffices: number;
  };
  creditLiability: number;
  officeBreakdown: { name: string; orders: number }[];
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

/* ── Delta badge ── */
function DeltaBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#9CA3AF]">
        0{suffix}
      </span>
    );
  }

  const positive = value > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        positive ? "text-[#22C55E]" : "text-[#DC2626]"
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={positive ? "" : "rotate-180"}
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
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
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
        styles[status] || "bg-[#F3F4F6] text-[#6B7280]"
      }`}
    >
      {status}
    </span>
  );
}

/* ── Stat card ── */
function StatCard({
  label,
  value,
  delta,
  deltaSuffix,
}: {
  label: string;
  value: string;
  delta: number;
  deltaSuffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
        {label}
      </p>
      <p
        className="text-[28px] font-bold text-[#1C1C1E] mt-1 leading-none"
        style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
      >
        {value}
      </p>
      <div className="mt-2">
        <DeltaBadge value={delta} suffix={deltaSuffix} />
        <span className="text-[11px] text-[#9CA3AF] ml-1">vs yesterday</span>
      </div>
    </div>
  );
}

/* ── Time formatter ── */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

/* ── Page ── */
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

        if (metricsData.success && metricsData.data) {
          setMetrics(metricsData.data);
        }

        if (ordersData.success && ordersData.data) {
          const paid = ordersData.data
            .filter((o: RecentOrder) => o.paymentStatus === "SUCCESS")
            .slice(0, 10);
          setRecentOrders(paid);
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

  /* Loading */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = metrics?.today;
  const week = metrics?.week;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-[#1C1C1E]"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
          >
            Dashboard
          </h1>
          {lastUpdated && (
            <p className="text-xs text-[#9CA3AF] mt-1">
              Last updated: {lastUpdated.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Today's Orders"
          value={String(today?.orders ?? 0)}
          delta={today?.ordersDelta ?? 0}
        />
        <StatCard
          label="Active Pools"
          value={`${today?.activeOffices ?? 0} / ${today?.totalOffices ?? 0}`}
          delta={(today?.activeOffices ?? 0) - (today?.activeOfficesYesterday ?? 0)}
        />
        <StatCard
          label="New Users"
          value={String(week?.newUsers ?? 0)}
          delta={week?.ordersDelta ?? 0}
          deltaSuffix=" orders"
        />
        <StatCard
          label="Revenue"
          value={formatNaira(today?.grossRevenue ?? 0)}
          delta={today?.ordersDelta ?? 0}
          deltaSuffix=" orders"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link
          href="/ops/orders"
          className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-5 py-4 hover:border-[#E84C3D]/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FEF2F0] flex items-center justify-center text-[#E84C3D]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1C1C1E]">View Orders</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9CA3AF] group-hover:text-[#E84C3D] transition-colors">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <Link
          href="/ops/products"
          className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-5 py-4 hover:border-[#E84C3D]/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FEF2F0] flex items-center justify-center text-[#E84C3D]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1C1C1E]">Manage Products</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9CA3AF] group-hover:text-[#E84C3D] transition-colors">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <Link
          href="/ops/pools"
          className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-5 py-4 hover:border-[#E84C3D]/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FEF2F0] flex items-center justify-center text-[#E84C3D]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1C1C1E]">View Pools</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9CA3AF] group-hover:text-[#E84C3D] transition-colors">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* Recent orders table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB]">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2
            className="text-base font-semibold text-[#1C1C1E]"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
          >
            Recent Orders
          </h2>
          <Link
            href="/ops/orders"
            className="text-xs font-medium text-[#E84C3D] hover:underline"
          >
            View all
          </Link>
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
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F8F8F6] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-[#1C1C1E]">
                        {order.orderCode}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#1C1C1E]">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3 font-medium text-[#1C1C1E]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatNaira(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-[#9CA3AF]">
                      {timeAgo(order.createdAt)}
                    </td>
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
