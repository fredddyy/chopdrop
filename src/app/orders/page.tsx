"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";

interface OrderData {
  id: string; orderCode: string; customerName: string; status: string;
  paymentStatus: string; totalAmount: number; quantity: number; createdAt: string;
  dailyMenu: { meal: { name: string; imageUrl: string | null; restaurant: { name: string } }; timeSlot: { startTime: string; endTime: string } };
  office?: { name: string; collectionPoint: string } | null;
}

function cleanName(name: string) { return name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, ""); }

function statusStyle(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case "CONFIRMED": return { label: "Cooking", bg: "rgba(212,162,78,0.12)", color: "var(--gold)" };
    case "READY": return { label: "On the way", bg: "rgba(13,159,95,0.1)", color: "var(--emerald)" };
    case "COMPLETED": return { label: "Delivered", bg: "rgba(13,159,95,0.1)", color: "var(--emerald)" };
    case "CANCELLED": return { label: "Cancelled", bg: "rgba(232,96,76,0.1)", color: "var(--coral)" };
    default: return { label: "Pending", bg: "var(--sand)", color: "var(--text-muted)" };
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "past">("active");
  const cart = useCart();

  useEffect(() => {
    fetch("/api/orders/mine").then((r) => r.json()).then((data) => { if (data.success) setOrders(data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
  const pastOrders = orders.filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED");
  const hasActive = activeOrders.length > 0;
  const hasPast = pastOrders.length > 0;

  function handleReorder(order: OrderData) {
    cart.addItem({
      dailyMenuId: order.id,
      name: order.dailyMenu.meal.name,
      description: "",
      imageUrl: order.dailyMenu.meal.imageUrl,
      restaurantName: order.dailyMenu.meal.restaurant.name,
      price: order.totalAmount / order.quantity,
    });
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 flex items-center justify-center min-h-svh" style={{ background: "var(--bg)" }}>
        <div className="w-7 h-7 border-[2.5px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--coral)", borderTopColor: "transparent" }} />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>No orders yet</h2>
          <p className="text-[14px] mb-6 text-center" style={{ color: "var(--text-muted)" }}>Your orders will appear here</p>
          <Link href="/menu" className="h-11 px-6 rounded-full text-[14px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Browse meals</Link>
        </div>
      ) : (
        <>
          {/* Tabs — only show if there are both active and past */}
          {hasActive && hasPast && (
            <div className="px-5 mb-4">
              <div className="flex rounded-full p-[3px]" style={{ background: "var(--sand)" }}>
                {(["active", "past"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)}
                    className={`flex-1 h-10 rounded-full text-[14px] font-bold transition-all cursor-pointer ${tab === t ? "bg-white" : ""}`}
                    style={{ color: tab === t ? "var(--text)" : "var(--text-muted)" }}>
                    {t === "active" ? `Active (${activeOrders.length})` : `Past (${pastOrders.length})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-5 space-y-3">
            {/* Active orders */}
            {(tab === "active" || !hasPast) && activeOrders.map((order) => {
              const st = statusStyle(order.status);
              return (
                <Link key={order.id} href={`/order/confirmation/${order.orderCode}`}
                  className="block rounded-[20px] p-4 active:scale-[0.98] transition-transform" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  {/* Row 1: Code + status + price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[18px] font-extrabold tracking-[0.03em] tabular-nums" style={{ color: "var(--text)" }}>{order.orderCode}</span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <span className="text-[17px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(order.totalAmount)}</span>
                  </div>
                  {/* Row 2: Food photo + name + restaurant */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-[12px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                      {order.dailyMenu.meal.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={order.dailyMenu.meal.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>{cleanName(order.dailyMenu.meal.name)}</h3>
                      <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{order.dailyMenu.meal.restaurant.name} · {order.quantity} item{order.quantity !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {/* Row 3: Arrival time + collection point */}
                  <div className="flex items-center gap-2 p-3 rounded-[12px]" style={{ background: "var(--sand)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                      Arrives by {order.dailyMenu.timeSlot.startTime}
                      {order.office?.collectionPoint && ` · ${order.office.collectionPoint}`}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Past orders */}
            {(tab === "past" || !hasActive) && pastOrders.length > 0 && (
              <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {pastOrders.map((order, idx) => {
                  const st = statusStyle(order.status);
                  return (
                    <div key={order.id} className="flex items-center gap-3 p-4" style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}>
                      <div className="w-12 h-12 rounded-[12px] overflow-hidden shrink-0" style={{ background: "var(--sand)" }}>
                        {order.dailyMenu.meal.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={order.dailyMenu.meal.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>{cleanName(order.dailyMenu.meal.name)}</h3>
                        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                          {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })} · {order.dailyMenu.meal.restaurant.name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[15px] font-extrabold tabular-nums" style={{ color: "var(--text)" }}>{formatNaira(order.totalAmount)}</span>
                        <button type="button" onClick={(e) => { e.preventDefault(); handleReorder(order); }}
                          className="text-[12px] font-bold px-3 py-1 rounded-full cursor-pointer active:scale-95 transition-transform"
                          style={{ background: "rgba(232,96,76,0.1)", color: "var(--coral)" }}>
                          Reorder
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No active orders message */}
            {tab === "active" && activeOrders.length === 0 && hasPast && (
              <div className="text-center py-10">
                <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--text)" }}>No active orders</p>
                <p className="text-[14px] mb-4" style={{ color: "var(--text-muted)" }}>Browse the menu to start a new order</p>
                <Link href="/menu" className="h-10 px-5 rounded-full text-[13px] font-bold inline-flex items-center" style={{ background: "var(--sand)", color: "var(--text)" }}>Browse meals</Link>
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav />
    </main>
  );
}
