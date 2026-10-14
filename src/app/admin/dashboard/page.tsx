"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  byRestaurant: { name: string; orders: number; revenue: number }[];
  byMeal: { name: string; count: number }[];
  byStatus: Record<string, number>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted">Failed to load dashboard</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted">Today&apos;s Orders</p>
          <p className="text-3xl font-bold">{data.totalOrders}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted">Revenue</p>
          <p className="text-3xl font-bold">
            {formatNaira(data.totalRevenue)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted">Issues</p>
          <p className="text-3xl font-bold">
            {data.byStatus.CANCELLED || 0}
          </p>
        </div>
      </div>

      {/* By Restaurant */}
      {data.byRestaurant.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">By Restaurant</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left p-3 font-medium">Restaurant</th>
                  <th className="text-right p-3 font-medium">Orders</th>
                  <th className="text-right p-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.byRestaurant.map((r) => (
                  <tr key={r.name} className="border-b border-border last:border-0">
                    <td className="p-3">{r.name}</td>
                    <td className="p-3 text-right">{r.orders}</td>
                    <td className="p-3 text-right">{formatNaira(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Meal */}
      {data.byMeal.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">By Meal</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left p-3 font-medium">Meal</th>
                  <th className="text-right p-3 font-medium">Plates</th>
                </tr>
              </thead>
              <tbody>
                {data.byMeal.map((m) => (
                  <tr key={m.name} className="border-b border-border last:border-0">
                    <td className="p-3">{m.name}</td>
                    <td className="p-3 text-right">{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
