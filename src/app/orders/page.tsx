"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";

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
}

const STATUS_STEP: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  READY: 2,
  COMPLETED: 3,
};

const STEPS = ["Paid", "Kitchen prep", "In transit", "At office"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use authenticated endpoint — server reads cookie
    fetch("/api/orders/mine")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const latestOrder = orders[0];
  const previousOrders = orders.slice(1);

  if (loading) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full pb-20 px-5 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-green border-t-transparent rounded-full animate-spin" />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full pb-20">
      <div className="px-5 md:px-12 py-8">
        <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Your orders</div>
        <h1 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Lunch history</h1>
      </div>

      <div className="px-5 md:px-12 pb-10">
        {orders.length === 0 ? (
          <div className="bg-paper border border-line rounded-[16px] p-8 text-center">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft mx-auto mb-3">
              <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" />
            </svg>
            <strong className="text-ink text-sm block">No orders yet</strong>
            <span className="text-ink-soft text-xs">Your order history will appear here after your first purchase.</span>
          </div>
        ) : (
          <>
            {/* Latest order */}
            {latestOrder && (
              <div className="bg-paper border border-line rounded-[16px] p-5 mb-6">
                <div className="flex items-center justify-between pb-4 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-green-soft text-green text-[10px] font-extrabold uppercase tracking-[0.07em] px-2.5 py-1.5 rounded-full leading-none">
                      {latestOrder.status === "COMPLETED" ? "Delivered" : latestOrder.status}
                    </span>
                    <span className="text-ink-soft text-[11px]">
                      {new Date(latestOrder.createdAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })} &middot; {latestOrder.orderCode}
                    </span>
                  </div>
                  <strong className="font-display font-bold text-[15px]">{formatNaira(latestOrder.totalAmount)}</strong>
                </div>

                <div className="flex items-center gap-3.5 py-4">
                  <div className="w-[64px] h-[54px] rounded-[10px] overflow-hidden bg-cream flex-shrink-0">
                    {latestOrder.dailyMenu.meal.imageUrl ? (
                      <img src={latestOrder.dailyMenu.meal.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                    )}
                  </div>
                  <div>
                    <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.08em]">
                      {latestOrder.dailyMenu.meal.restaurant.name}
                    </div>
                    <strong className="font-display text-[15px] block mt-0.5">{latestOrder.dailyMenu.meal.name}</strong>
                    <small className="text-ink-soft text-[11px]">{latestOrder.quantity} meal &middot; Paid with Paystack</small>
                  </div>
                </div>

                {/* Progress */}
                <div className="grid grid-cols-4 pt-4 border-t border-line">
                  {STEPS.map((step, idx) => {
                    const currentStep = STATUS_STEP[latestOrder.status] ?? 0;
                    const done = idx < currentStep;
                    const active = idx === currentStep;
                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5 relative">
                        {idx < STEPS.length - 1 && (
                          <div className={`absolute top-[11px] left-[calc(50%+11px)] right-[calc(-50%+11px)] h-[1px] ${done ? "bg-green" : "bg-line"}`} />
                        )}
                        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 ${
                          done || active ? "bg-green text-white" : "bg-cream border border-line text-ink-soft"
                        }`}>
                          {done || active ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                          )}
                        </div>
                        <span className={`text-[9px] font-semibold ${done || active ? "text-green font-bold" : "text-ink-soft"}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Previous orders */}
            {previousOrders.length > 0 && (
              <>
                <div className="font-display font-bold text-[17px] mb-3">Previous orders</div>
                {previousOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-3.5 py-4 border-b border-line">
                    <div className="w-10 h-10 rounded-[10px] bg-green-soft text-green flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-[13px] block">{order.dailyMenu.meal.name}</strong>
                      <span className="text-ink-soft text-[10px]">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })} &middot; {order.orderCode} &middot; {order.status === "COMPLETED" ? "Delivered" : order.status}
                      </span>
                    </div>
                    <strong className="font-display text-[13px]">{formatNaira(order.totalAmount)}</strong>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft flex-shrink-0">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
