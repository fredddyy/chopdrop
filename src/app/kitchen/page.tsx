"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";
import { CountdownTimer } from "@/components/countdown-timer";
import { Logo } from "@/components/logo";

interface OrderData {
  id: string;
  orderCode: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  quantity: number;
  dailyMenu: {
    meal: { name: string; imageUrl: string | null; restaurant: { name: string } };
  };
  items: { menuItem: { name: string }; quantity: number }[];
}

interface MealGroup {
  name: string;
  imageUrl: string | null;
  count: number;
  revenue: number;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [readyCount, setReadyCount] = useState(0);
  const [checklist, setChecklist] = useState([false, false, false, false]);

  useEffect(() => {
    fetch("/api/admin/orders?date=" + new Date().toISOString().split("T")[0])
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const confirmed = data.data.filter((o: OrderData) => o.paymentStatus === "SUCCESS");
          setOrders(confirmed);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group by meal
  const mealMap = new Map<string, MealGroup>();
  for (const order of orders) {
    const name = order.dailyMenu.meal.name;
    const existing = mealMap.get(name);
    if (existing) {
      existing.count += order.quantity;
      existing.revenue += order.totalAmount;
    } else {
      mealMap.set(name, {
        name,
        imageUrl: order.dailyMenu.meal.imageUrl,
        count: order.quantity,
        revenue: order.totalAmount,
      });
    }
  }
  const mealGroups = Array.from(mealMap.values());
  const totalBoxes = mealGroups.reduce((s, m) => s + m.count, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const restaurantName = orders[0]?.dailyMenu.meal.restaurant.name || "Your Kitchen";

  const toggleCheck = (idx: number) => {
    setChecklist((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const checklistItems = ["Correct meal count", "Boxes sealed", "Boxes batch-labelled", "Driver code verified"];

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-cream">
        <div className="w-8 h-8 border-[3px] border-green border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[225px] bg-ink text-white flex-col p-5 z-30">
        <div className="mb-6">
          <Logo size={28} variant="dark" />
        </div>
        <div className="flex items-center gap-2.5 bg-white/[0.08] rounded-[11px] p-3 mb-5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
            <path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M16 3v18M16 3c4 2 4 8 0 10" />
          </svg>
          <div>
            <small className="text-[#91a49c] text-[9px] uppercase block">Kitchen portal</small>
            <strong className="text-[12px]">{restaurantName}</strong>
          </div>
        </div>
        <nav className="space-y-1">
          <div className="flex items-center gap-2.5 bg-lime/[0.12] text-lime rounded-[10px] px-3 py-2.5 text-[13px] font-bold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Overview
          </div>
          {[["Orders", "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6"], ["Settlement", "M3 5h18v14H3zM3 10h18"]].map(([label, path]) => (
            <div key={label} className="flex items-center gap-2.5 text-[#aebcb7] rounded-[10px] px-3 py-2.5 text-[13px] hover:bg-white/[0.05] cursor-pointer transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
              {label}
            </div>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 text-[#aebcb7] rounded-[10px] px-3 py-2.5 text-[13px] hover:bg-white/[0.05] cursor-pointer transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>
          Sign out
        </div>
      </aside>

      {/* Main */}
      <main className="md:ml-[225px] px-5 md:px-10 py-8 pb-20 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">
              {restaurantName} &middot; Ikeja
            </div>
            <h1 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Today&apos;s prep board</h1>
            <p className="text-ink-soft text-[13px] mt-1">Final quantities are locked. Prepare exactly what was prepaid.</p>
          </div>
          <span className="bg-green-soft text-green text-[10px] font-extrabold uppercase tracking-[0.07em] px-3 py-2 rounded-full self-start">
            Orders locked &middot; 10:30 AM
          </span>
        </div>

        {/* Kitchen banner */}
        <div className="bg-amber rounded-[15px] px-5 py-4 flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            <div>
              <small className="text-[#6f5b34] text-[9px] block">Driver collection window</small>
              <strong className="font-display font-bold text-[16px]">12:05–12:15 PM</strong>
            </div>
          </div>
          <CountdownTimer cutoffTime="23:59" compact />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          <div className="bg-paper border border-line rounded-[13px] p-4">
            <span className="text-ink-soft text-[10px] font-bold block">Meals to prepare</span>
            <strong className="font-display font-[750] text-[25px] tracking-[-0.04em] block mt-1">{totalBoxes}</strong>
            <small className="text-ink-soft text-[9px]">{mealGroups.length} menu item{mealGroups.length !== 1 ? "s" : ""}</small>
          </div>
          <div className="bg-paper border border-line rounded-[13px] p-4">
            <span className="text-ink-soft text-[10px] font-bold block">Paid value</span>
            <strong className="font-display font-[750] text-[25px] tracking-[-0.04em] block mt-1">{formatNaira(totalRevenue)}</strong>
            <small className="text-ink-soft text-[9px]">Settlement pending</small>
          </div>
          <div className="bg-paper border border-line rounded-[13px] p-4 border-t-[3px] border-t-green">
            <span className="text-ink-soft text-[10px] font-bold block">Ready for pickup</span>
            <strong className="font-display font-[750] text-[25px] tracking-[-0.04em] block mt-1">{readyCount} / {totalBoxes}</strong>
            <small className="text-ink-soft text-[9px]">{readyCount === totalBoxes ? "Drop complete" : `${totalBoxes - readyCount} boxes remaining`}</small>
          </div>
        </div>

        {/* Prep cards per meal */}
        {mealGroups.map((meal) => (
          <div key={meal.name} className="bg-paper border border-line rounded-[15px] p-5 mb-4 flex flex-col sm:flex-row gap-5">
            {/* Image */}
            <div className="w-full sm:w-[190px] h-[150px] rounded-xl overflow-hidden bg-cream flex-shrink-0">
              {meal.imageUrl ? (
                <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1">
              <span className="bg-amber-soft text-[#7d5716] text-[10px] font-extrabold uppercase tracking-[0.07em] px-2.5 py-1 rounded-full">Today&apos;s menu</span>
              <h3 className="font-display font-bold text-[23px] tracking-[-0.03em] mt-2">{meal.name}</h3>
              <div className="flex gap-6 mt-4">
                <div>
                  <span className="text-ink-soft text-[9px] block">Quantity</span>
                  <strong className="text-[11px]">{meal.count} boxes</strong>
                </div>
                <div>
                  <span className="text-ink-soft text-[9px] block">Packaging</span>
                  <strong className="text-[11px]">Seal + label</strong>
                </div>
                <div>
                  <span className="text-ink-soft text-[9px] block">Revenue</span>
                  <strong className="text-[11px]">{formatNaira(meal.revenue)}</strong>
                </div>
              </div>
            </div>
            {/* Ready counter */}
            <div className="border-t sm:border-t-0 sm:border-l border-line pt-4 sm:pt-0 sm:pl-5 text-center flex-shrink-0">
              <span className="text-ink-soft text-[10px] block">Mark boxes ready</span>
              <div className="flex items-center justify-center gap-3 mt-2">
                <button type="button" onClick={() => setReadyCount(Math.max(0, readyCount - 1))} className="w-9 h-9 border border-line rounded-[10px] flex items-center justify-center hover:bg-cream transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                </button>
                <strong className="font-display font-[750] text-[32px] min-w-[35px]">{readyCount}</strong>
                <button type="button" onClick={() => setReadyCount(Math.min(totalBoxes, readyCount + 1))} className="w-9 h-9 bg-coral text-white rounded-[10px] flex items-center justify-center hover:bg-[#d95038] transition-colors shadow-sm">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>
              <small className="text-ink-soft text-[10px] mt-1 block">of {totalBoxes} required</small>
            </div>
          </div>
        ))}

        {/* Packing checklist */}
        <div className="bg-paper border border-line rounded-[15px] p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-display font-bold text-[17px]">Packing checklist</div>
              <span className="text-ink-soft text-[10px]">Complete before driver handoff</span>
            </div>
            <span className="text-ink-soft text-[10px] font-bold">
              {checklist.filter(Boolean).length} / {checklist.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checklistItems.map((item, idx) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleCheck(idx)}
                className={`flex items-center gap-3 border rounded-[10px] p-3 text-left transition-all ${
                  checklist[idx]
                    ? "bg-green-soft border-green/30"
                    : "border-line hover:border-ink-soft/30"
                }`}
              >
                <div className={`w-[22px] h-[22px] rounded-[6px] border flex items-center justify-center flex-shrink-0 ${
                  checklist[idx] ? "bg-green border-green text-white" : "border-line"
                }`}>
                  {checklist[idx] && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                  )}
                </div>
                <span className="text-[11px] font-semibold">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
