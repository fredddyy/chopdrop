"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function formatNaira(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString();
}

interface OrderData {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  quantity: number;
  officeId: string | null;
  dailyMenu: {
    meal: { name: string; restaurant: { id: string; name: string } };
    timeSlot: { label: string };
  };
}

interface KitchenBatch {
  restaurantId: string;
  restaurantName: string;
  meals: { name: string; count: number }[];
  totalPlates: number;
  pickedUp: boolean;
}

interface OfficeDrop {
  officeId: string;
  officeName: string;
  address: string;
  collectionPoint: string;
  captainName: string | null;
  captainPhone: string | null;
  totalPlates: number;
  orders: OrderData[];
  delivered: boolean;
}

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [offices, setOffices] = useState<Record<string, { name: string; address: string; collectionPoint: string; assistantName: string | null; assistantPhone: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadOrders() {
    try {
      const [ordersRes, officesRes] = await Promise.all([
        fetch("/api/admin/orders?date=" + new Date().toISOString().split("T")[0]).then(r => r.json()),
        fetch("/api/admin/offices").then(r => r.json()),
      ]);
      if (ordersRes.success) {
        setOrders(ordersRes.data.filter((o: OrderData) => o.paymentStatus === "SUCCESS"));
      }
      if (officesRes.success) {
        const map: typeof offices = {};
        for (const o of officesRes.data) {
          map[o.id] = { name: o.name, address: o.address, collectionPoint: o.collectionPoint, assistantName: o.assistantName, assistantPhone: o.assistantPhone };
        }
        setOffices(map);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadOrders();
    } catch { /* ignore */ }
    setUpdating(null);
  }

  async function bulkUpdateStatus(orderIds: string[], status: string) {
    setUpdating("bulk");
    try {
      await Promise.all(orderIds.map(id =>
        fetch(`/api/admin/orders/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      ));
      await loadOrders();
    } catch { /* ignore */ }
    setUpdating(null);
  }

  // Build kitchen batches
  const kitchenMap = new Map<string, KitchenBatch>();
  for (const order of orders) {
    const rId = order.dailyMenu.meal.restaurant.id;
    const rName = order.dailyMenu.meal.restaurant.name;
    if (!kitchenMap.has(rId)) {
      kitchenMap.set(rId, { restaurantId: rId, restaurantName: rName, meals: [], totalPlates: 0, pickedUp: false });
    }
    const batch = kitchenMap.get(rId)!;
    const mealName = order.dailyMenu.meal.name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, "");
    const existing = batch.meals.find(m => m.name === mealName);
    if (existing) existing.count += order.quantity;
    else batch.meals.push({ name: mealName, count: order.quantity });
    batch.totalPlates += order.quantity;
  }
  const kitchenBatches = Array.from(kitchenMap.values());

  // Build office drops
  const officeMap = new Map<string, OfficeDrop>();
  for (const order of orders) {
    const oId = order.officeId || "no-office";
    if (!officeMap.has(oId)) {
      const officeData = order.officeId ? offices[order.officeId] : null;
      officeMap.set(oId, {
        officeId: oId,
        officeName: officeData?.name || "Walk-in / No office",
        address: officeData?.address || "",
        collectionPoint: officeData?.collectionPoint || "",
        captainName: officeData?.assistantName || null,
        captainPhone: officeData?.assistantPhone || null,
        totalPlates: 0,
        orders: [],
        delivered: false,
      });
    }
    const drop = officeMap.get(oId)!;
    drop.totalPlates += order.quantity;
    drop.orders.push(order);
  }
  const officeDrops = Array.from(officeMap.values()).sort((a, b) => b.totalPlates - a.totalPlates);

  const totalPlates = orders.reduce((s, o) => s + o.quantity, 0);
  const confirmedCount = orders.filter(o => o.status === "CONFIRMED" || o.status === "READY" || o.status === "COMPLETED").length;
  const readyCount = orders.filter(o => o.status === "READY").length;
  const completedCount = orders.filter(o => o.status === "COMPLETED").length;

  if (loading) {
    return (
      <main className="min-h-svh flex items-center justify-center" style={{ background: "#FAF7F2" }}>
        <div className="w-8 h-8 border-2 border-[#C4572A] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-svh" style={{ background: "#FAF7F2" }}>
      {/* Header */}
      <header style={{ background: "#141413" }}>
        <div className="max-w-3xl mx-auto px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <Link href="/ops" className="text-[13px] font-semibold text-white/40 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
              Back to ops
            </Link>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#1A7D4B] animate-pulse" />
              <span className="text-[12px] font-semibold text-white/40">Live · refreshes every 30s</span>
            </div>
          </div>
          <h1 className="text-[28px] font-extrabold text-white tracking-[-0.02em]">Today&apos;s Orders</h1>
          <p className="text-[15px] text-white/50 mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: "Orders", value: orders.length, color: "white" },
              { label: "Plates", value: totalPlates, color: "#1A7D4B" },
              { label: "Kitchens", value: kitchenBatches.length, color: "#D4A24E" },
              { label: "Offices", value: officeDrops.length, color: "#C4572A" },
            ].map(s => (
              <div key={s.label} className="rounded-[12px] p-3 text-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="text-[22px] font-extrabold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px] text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-[48px] font-extrabold" style={{ color: "#E8E2DA" }}>0</div>
            <p className="text-[16px] font-semibold mt-2" style={{ color: "#6B6560" }}>No orders today yet</p>
            <p className="text-[14px] mt-1" style={{ color: "#9C9590" }}>Orders will appear here after the pool closes</p>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════ */}
            {/* SECTION 1: KITCHEN PICKUP LIST              */}
            {/* ═══════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#C4572A" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold" style={{ color: "#2D2A26" }}>Kitchen Pickup</h2>
                  <p className="text-[12px]" style={{ color: "#9C9590" }}>Take this list to each restaurant</p>
                </div>
              </div>

              <div className="space-y-3">
                {kitchenBatches.map(batch => {
                  const batchOrders = orders.filter(o => o.dailyMenu.meal.restaurant.id === batch.restaurantId);
                  const allConfirmed = batchOrders.every(o => o.status !== "PENDING");
                  const orderText = `Order for ChopDrop\n\n${batch.meals.map(m => `${m.count}x ${m.name}`).join("\n")}\n\nTotal: ${batch.totalPlates} plates\nPayment: Already paid online`;

                  return (
                    <div key={batch.restaurantId} className="rounded-[16px] overflow-hidden" style={{ background: "white", border: "1px solid #E8E2DA" }}>
                      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E8E2DA" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white" style={{ background: "#C4572A" }}>
                            {batch.restaurantName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-[15px] font-bold" style={{ color: "#2D2A26" }}>{batch.restaurantName}</h3>
                            <span className="text-[12px]" style={{ color: "#9C9590" }}>{batch.totalPlates} plates</span>
                          </div>
                        </div>
                        {allConfirmed && (
                          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full" style={{ background: "rgba(26,125,75,0.1)", color: "#1A7D4B" }}>Picked up</span>
                        )}
                      </div>

                      <div className="px-4 py-3">
                        {batch.meals.map((meal, i) => (
                          <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < batch.meals.length - 1 ? "1px solid #F0EBE4" : "none" }}>
                            <span className="text-[14px]" style={{ color: "#2D2A26" }}>{meal.name}</span>
                            <span className="text-[16px] font-extrabold tabular-nums" style={{ color: "#2D2A26" }}>{meal.count}x</span>
                          </div>
                        ))}
                      </div>

                      <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid #E8E2DA" }}>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(orderText)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 h-10 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                          style={{ background: "#25d366", color: "white" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          Send to kitchen
                        </a>
                        {!allConfirmed && (
                          <button type="button" disabled={updating === "bulk"} onClick={() => bulkUpdateStatus(batchOrders.map(o => o.id), "CONFIRMED")}
                            className="flex-1 h-10 rounded-[10px] text-[13px] font-bold active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-50"
                            style={{ background: "#141413", color: "white" }}>
                            Mark picked up
                          </button>
                        )}
                        <button type="button" onClick={() => { navigator.clipboard.writeText(orderText); }}
                          className="h-10 px-4 rounded-[10px] text-[12px] font-bold cursor-pointer"
                          style={{ background: "#F0EBE4", color: "#6B6560" }}>
                          Copy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* SECTION 2: DELIVERY LIST (by office)        */}
            {/* ═══════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#1A7D4B" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold" style={{ color: "#2D2A26" }}>Delivery</h2>
                  <p className="text-[12px]" style={{ color: "#9C9590" }}>Drop food at each office</p>
                </div>
              </div>

              <div className="space-y-3">
                {officeDrops.map(drop => {
                  const allDelivered = drop.orders.every(o => o.status === "COMPLETED");

                  return (
                    <div key={drop.officeId} className="rounded-[16px] overflow-hidden" style={{ background: "white", border: allDelivered ? "1px solid rgba(26,125,75,0.3)" : "1px solid #E8E2DA" }}>
                      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E8E2DA" }}>
                        <div>
                          <h3 className="text-[15px] font-bold" style={{ color: "#2D2A26" }}>{drop.officeName}</h3>
                          <p className="text-[12px]" style={{ color: "#9C9590" }}>
                            {drop.collectionPoint}{drop.captainName ? ` · Captain: ${drop.captainName}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[20px] font-extrabold tabular-nums" style={{ color: allDelivered ? "#1A7D4B" : "#2D2A26" }}>{drop.totalPlates}</span>
                          <span className="text-[12px] block" style={{ color: "#9C9590" }}>plates</span>
                        </div>
                      </div>

                      {/* Individual orders */}
                      <div className="px-4 py-2">
                        {drop.orders.map(order => (
                          <div key={order.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid #F0EBE4" }}>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-semibold" style={{ color: "#2D2A26" }}>{order.customerName}</span>
                              <span className="text-[12px] ml-2" style={{ color: "#9C9590" }}>{order.dailyMenu.meal.name.replace(/^(Small|Regular|Large|XL)\s*(VM\s*[-–]\s*)?/i, "")} x{order.quantity}</span>
                            </div>
                            <span className="text-[14px] font-bold tabular-nums" style={{ color: "#C4572A" }}>{order.orderCode}</span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              order.status === "COMPLETED" ? "bg-[rgba(26,125,75,0.1)] text-[#1A7D4B]" :
                              order.status === "READY" ? "bg-[rgba(212,162,78,0.15)] text-[#7d5716]" :
                              order.status === "CONFIRMED" ? "bg-[rgba(26,125,75,0.06)] text-[#1A7D4B]" :
                              "bg-[#F0EBE4] text-[#9C9590]"
                            }`}>{order.status}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid #E8E2DA" }}>
                        {!allDelivered ? (
                          <>
                            <button type="button" disabled={updating === "bulk"} onClick={() => bulkUpdateStatus(drop.orders.map(o => o.id), "READY")}
                              className="flex-1 h-10 rounded-[10px] text-[13px] font-bold active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-50"
                              style={{ background: "#D4A24E", color: "white" }}>
                              Mark on the way
                            </button>
                            <button type="button" disabled={updating === "bulk"} onClick={() => bulkUpdateStatus(drop.orders.map(o => o.id), "COMPLETED")}
                              className="flex-1 h-10 rounded-[10px] text-[13px] font-bold active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-50"
                              style={{ background: "#1A7D4B", color: "white" }}>
                              Mark delivered
                            </button>
                          </>
                        ) : (
                          <div className="flex-1 h-10 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2" style={{ background: "rgba(26,125,75,0.06)", color: "#1A7D4B" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                            Delivered
                          </div>
                        )}
                        {drop.captainPhone && (
                          <a href={`https://wa.me/${drop.captainPhone}`} target="_blank" rel="noopener noreferrer"
                            className="h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0"
                            style={{ background: "#25d366" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Progress bar */}
            <div className="rounded-[16px] p-5" style={{ background: "white", border: "1px solid #E8E2DA" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-bold" style={{ color: "#2D2A26" }}>Fulfillment progress</span>
                <span className="text-[14px] font-bold tabular-nums" style={{ color: "#1A7D4B" }}>{completedCount}/{orders.length}</span>
              </div>
              <div className="flex gap-1">
                {[
                  { label: "Pending", count: orders.length - confirmedCount, color: "#E8E2DA" },
                  { label: "Confirmed", count: confirmedCount - readyCount - completedCount, color: "#D4A24E" },
                  { label: "On the way", count: readyCount, color: "#C4572A" },
                  { label: "Delivered", count: completedCount, color: "#1A7D4B" },
                ].map(s => (
                  <div key={s.label} className="flex-1">
                    <div className="h-2 rounded-full" style={{ background: s.count > 0 ? s.color : "#F0EBE4" }} />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px]" style={{ color: "#9C9590" }}>{s.label}</span>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: s.count > 0 ? "#2D2A26" : "#9C9590" }}>{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
