"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";

interface OrderData {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: string;
  deliveryAddress: string | null;
  quantity: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  dailyMenu: {
    meal: { name: string; restaurant: { name: string } };
    timeSlot: { startTime: string; endTime: string };
  };
  items: { menuItem: { name: string }; price: number; quantity: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  CONFIRMED: "bg-blue-100 text-blue-700",
  READY: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const NEXT_STATUS: Record<string, string> = {
  CONFIRMED: "READY",
  READY: "COMPLETED",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  async function loadOrders() {
    const params = new URLSearchParams({ date });
    if (filter) params.set("status", filter);

    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [date, filter]);

  async function updateStatus(orderId: string, status: string) {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="READY">Ready</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted text-center py-12">No orders found</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Meal</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-right p-3 font-medium">Qty</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-3 font-mono font-bold text-primary">
                    {order.orderCode}
                  </td>
                  <td className="p-3">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-muted">
                      {order.customerPhone}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>{order.dailyMenu.meal.name}</div>
                    <div className="text-xs text-muted">
                      {order.dailyMenu.meal.restaurant.name}
                    </div>
                    {order.items.length > 0 && (
                      <div className="text-xs text-muted mt-1">
                        {order.items
                          .map((i) => i.menuItem.name)
                          .join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="p-3">{order.fulfillmentType}</td>
                  <td className="p-3 text-right">{order.quantity}</td>
                  <td className="p-3 text-right">
                    {formatNaira(order.totalAmount)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[order.status] || ""
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={() =>
                          updateStatus(
                            order.id,
                            NEXT_STATUS[order.status]
                          )
                        }
                        className="px-3 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary-dark"
                      >
                        Mark {NEXT_STATUS[order.status]}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
