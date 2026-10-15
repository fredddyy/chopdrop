"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";

interface OrderData {
  id: string;
  orderCode: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  quantity: number;
  createdAt: string;
  dailyMenu: {
    meal: { name: string; imageUrl: string | null; restaurant: { name: string } };
    timeSlot: { startTime: string; endTime: string };
  };
  office?: { name: string; assistantName: string | null; assistantPhone: string | null; collectionPoint: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-[#92400e]", bg: "bg-[#fef3c7]" },
  CONFIRMED: { label: "Confirmed", color: "text-[#0f4030]", bg: "bg-[#d1fae5]" },
  READY: { label: "Ready", color: "text-[#1e40af]", bg: "bg-[#dbeafe]" },
  COMPLETED: { label: "Delivered", color: "text-[#0f4030]", bg: "bg-[#d1fae5]" },
  CANCELLED: { label: "Cancelled", color: "text-[#991b1b]", bg: "bg-[#fee2e2]" },
};

const STEPS = [
  { key: "PENDING", label: "Paid", icon: "M5 12l4 4L19 6" },
  { key: "CONFIRMED", label: "Cooking", icon: "M5 4v7M8 4v7M5 8h3M6.5 11v9M15 4v16M15 4c3 2 3 7 0 9" },
  { key: "READY", label: "On the way", icon: "M3 6h11v11H3zM14 10h4l3 4v3h-7z" },
  { key: "COMPLETED", label: "Delivered", icon: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "READY", "COMPLETED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/mine")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
  const pastOrders = orders.filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED");

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 flex items-center justify-center">
        <div className="w-7 h-7 border-[2.5px] border-[#0f4030] border-t-transparent rounded-full animate-spin" />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 bg-[#fafaf8]">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h1 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em]">Orders</h1>
        <p className="text-[#9ca3af] text-[11px] mt-0.5">
          {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? "s" : ""}` : "Your order history"}
        </p>
      </div>

      <div className="px-5">
        {orders.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center py-16">
            <div className="w-16 h-16 bg-[#f5f5f3] rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#9ca3af]">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-[18px] text-[#1a1a1a] mb-1">No orders yet</h2>
            <p className="text-[#9ca3af] text-[13px] mb-5 text-center max-w-[240px]">Your order history will appear here after your first drop</p>
            <Link href="/menu" className="bg-[#f05f4b] text-white text-[13px] font-bold px-6 py-2.5 rounded-full shadow-[0_2px_10px_rgba(240,95,75,0.3)] active:scale-95 transition-transform">
              Browse meals
            </Link>
          </div>
        ) : (
          <>
            {/* ── Active orders ── */}
            {activeOrders.length > 0 && (
              <section className="mb-6">
                <h2 className="text-[12px] font-bold text-[#0f4030] uppercase tracking-[0.06em] mb-3">Active</h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => {
                    const currentIdx = STATUS_ORDER.indexOf(order.status);
                    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                    return (
                      <div key={order.id} className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`${status.bg} ${status.color} text-[9px] font-bold uppercase tracking-[0.04em] px-2 py-0.5 rounded-md`}>
                              {status.label}
                            </span>
                            <span className="text-[10px] text-[#9ca3af]">{order.orderCode}</span>
                          </div>
                          <span className="font-display font-bold text-[15px] text-[#1a1a1a]">{formatNaira(order.totalAmount)}</span>
                        </div>

                        {/* Meal info */}
                        <div className="flex items-center gap-3 pb-3 border-b border-[#f0efeb]">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {order.dailyMenu.meal.imageUrl ? (
                              <img src={order.dailyMenu.meal.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[16px]">🍽️</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[13px] font-semibold text-[#1a1a1a] leading-tight truncate">{order.dailyMenu.meal.name}</h3>
                            <p className="text-[10px] text-[#9ca3af] mt-0.5">{order.dailyMenu.meal.restaurant.name} · {order.quantity} item{order.quantity !== 1 ? "s" : ""}</p>
                          </div>
                        </div>

                        {/* Progress tracker */}
                        <div className="flex items-center justify-between pt-3 px-1">
                          {STEPS.map((step, idx) => {
                            const done = idx <= currentIdx;
                            const isLast = idx === STEPS.length - 1;
                            return (
                              <div key={step.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    done ? "bg-[#0f4030] text-white" : "bg-[#f5f5f3] text-[#d1d5db]"
                                  }`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={step.icon} /></svg>
                                  </div>
                                  <span className={`text-[8px] mt-1 font-medium ${done ? "text-[#0f4030]" : "text-[#d1d5db]"}`}>{step.label}</span>
                                </div>
                                {!isLast && (
                                  <div className={`flex-1 h-[2px] mx-1 rounded-full ${idx < currentIdx ? "bg-[#0f4030]" : "bg-[#f0efeb]"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Captain info */}
                        {order.office?.assistantName && (
                          <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-[#f0efeb] px-1">
                            <div className="w-7 h-7 bg-[#0f4030]/[0.06] rounded-full flex items-center justify-center flex-shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0f4030]"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-[#9ca3af]">Captain</span>
                              <span className="text-[12px] font-semibold text-[#1a1a1a] block">{order.office.assistantName}</span>
                            </div>
                            {order.office.assistantPhone && (
                              <a href={`tel:${order.office.assistantPhone}`} className="text-[10px] font-semibold text-[#22c55e]">Call</a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Past orders ── */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-[0.06em] mb-3">
                  {activeOrders.length > 0 ? "Past orders" : "Order history"}
                </h2>
                <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                  {pastOrders.map((order, idx) => {
                    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.COMPLETED;
                    return (
                      <div key={order.id} className={`flex items-center gap-3 px-4 py-3.5 ${idx > 0 ? "border-t border-[#f0efeb]" : ""}`}>
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f5f5f3] flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {order.dailyMenu.meal.imageUrl ? (
                            <img src={order.dailyMenu.meal.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[14px]">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold text-[#1a1a1a] leading-tight truncate">{order.dailyMenu.meal.name}</h3>
                          <p className="text-[10px] text-[#9ca3af] mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })} · {order.orderCode}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-display font-bold text-[13px] text-[#1a1a1a] block">{formatNaira(order.totalAmount)}</span>
                          <span className={`${status.color} text-[9px] font-semibold`}>{status.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
