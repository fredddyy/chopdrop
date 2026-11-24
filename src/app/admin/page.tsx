"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard } from "lucide-react";

function fp(kobo: number): string { return "\u20A6" + Math.round(kobo / 100).toLocaleString(); }

interface Metrics {
  revenue: { today: number; week: number; month: number };
  orders: { total: number; pending: number; confirmed: number; ready: number; completed: number };
  pools: { active: number; filled: number; expired: number };
  users: { total: number; today: number; week: number };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard/metrics")
      .then(r => r.json())
      .then(d => { if (d.success) setMetrics(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <LayoutDashboard size={20} style={{ color: "#E84C3D" }} />
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Dashboard</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <div className="h-4 rounded w-[60%] mb-2" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 80}ms` }} />
              <div className="h-7 rounded w-[45%]" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 80 + 40}ms` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Revenue Today", value: metrics ? fp(metrics.revenue.today) : "₦0", color: "#22C55E" },
    { label: "Orders Today", value: metrics?.orders.total?.toString() || "0", color: "#E84C3D" },
    { label: "Active Pools", value: metrics?.pools.active?.toString() || "0", color: "#3498DB" },
    { label: "New Users (Week)", value: metrics?.users.week?.toString() || "0", color: "#F39C12" },
  ];

  const orderStatuses = [
    { label: "Pending", count: metrics?.orders.pending || 0, bg: "#FEF2F0", color: "#E84C3D" },
    { label: "Confirmed", count: metrics?.orders.confirmed || 0, bg: "#FEF9C3", color: "#CA8A04" },
    { label: "Ready", count: metrics?.orders.ready || 0, bg: "#DBEAFE", color: "#3498DB" },
    { label: "Completed", count: metrics?.orders.completed || 0, bg: "#F0FDF4", color: "#22C55E" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard size={20} style={{ color: "#E84C3D" }} />
        <h1 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <p className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>{s.label}</p>
            <p className="text-[22px] font-extrabold tabular-nums leading-tight mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Order status pills */}
      <div className="rounded-[14px] p-4 mb-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
        <h3 className="text-[14px] font-bold mb-3" style={{ color: "#1C1C1E" }}>Orders by Status</h3>
        <div className="flex flex-wrap gap-2">
          {orderStatuses.map(s => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: s.bg }}>
              <span className="text-[18px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: s.color }}>{s.count}</span>
              <span className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: "#9CA3AF" }}>Revenue This Week</p>
          <p className="text-[18px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{metrics ? fp(metrics.revenue.week) : "₦0"}</p>
        </div>
        <div className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: "#9CA3AF" }}>Revenue This Month</p>
          <p className="text-[18px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{metrics ? fp(metrics.revenue.month) : "₦0"}</p>
        </div>
        <div className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: "#9CA3AF" }}>Total Users</p>
          <p className="text-[18px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>{metrics?.users.total || 0}</p>
        </div>
      </div>
    </div>
  );
}
