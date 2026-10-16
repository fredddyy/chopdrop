"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatNaira } from "@/lib/utils";
import { getCustomerProfile } from "@/lib/customer";
import { CountdownTimer } from "@/components/countdown-timer";
import { Logo } from "@/components/logo";

interface OrderData {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  quantity: number;
  dailyMenu: {
    meal: { name: string; restaurant: { name: string } };
    timeSlot: { startTime: string; endTime: string };
  };
}

interface OfficeData {
  id: string;
  name: string;
  code: string;
  address: string;
  collectionPoint: string;
  assistantName: string | null;
}

interface BatchGroup {
  restaurant: string;
  meals: { name: string; count: number }[];
  totalBoxes: number;
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-cream"><div className="w-8 h-8 border-[3px] border-green border-t-transparent rounded-full animate-spin" /></div>}>
      <AssistantContent />
    </Suspense>
  );
}

function AssistantContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [office, setOffice] = useState<OfficeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [received, setReceived] = useState(false);
  const [officeCode, setOfficeCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  // Get office code from URL, profile, or prompt
  useEffect(() => {
    const urlCode = searchParams.get("office");
    const profile = getCustomerProfile();
    const code = urlCode || profile?.officeCode || "";
    if (code) {
      setOfficeCode(code);
      loadOfficeOrders(code);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  async function loadOfficeOrders(code: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/offices/${encodeURIComponent(code)}/orders`);
      const data = await res.json();
      if (data.success) {
        setOffice(data.data.office);
        setOrders(data.data.orders);
        setOfficeCode(code);
      } else {
        setCodeError("Office not found");
      }
    } catch {
      setCodeError("Network error");
    }
    setLoading(false);
  }

  function handleCodeSubmit() {
    if (!codeInput.trim()) return;
    setCodeError("");
    loadOfficeOrders(codeInput.trim().toUpperCase());
  }

  // Group orders by restaurant
  const batches: BatchGroup[] = [];
  const restaurantMap = new Map<string, Map<string, number>>();
  for (const order of orders) {
    const rName = order.dailyMenu.meal.restaurant.name;
    const mName = order.dailyMenu.meal.name;
    if (!restaurantMap.has(rName)) restaurantMap.set(rName, new Map());
    const mealMap = restaurantMap.get(rName)!;
    mealMap.set(mName, (mealMap.get(mName) || 0) + order.quantity);
  }
  for (const [restaurant, mealMap] of restaurantMap) {
    const meals: { name: string; count: number }[] = [];
    let totalBoxes = 0;
    for (const [name, count] of mealMap) {
      meals.push({ name, count });
      totalBoxes += count;
    }
    batches.push({ restaurant, meals, totalBoxes });
  }

  const totalBoxes = batches.reduce((s, b) => s + b.totalBoxes, 0);
  const distributionFee = Math.round(totalBoxes * 15000);

  // No office connected yet — show code entry
  if (!loading && !office) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-5">
        <div className="max-w-sm w-full">
          <div className="mb-8">
            <Logo size={28} />
          </div>
          <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Office assistant</div>
          <h1 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-2">Enter your office code</h1>
          <p className="text-ink-soft text-[13px] mt-2 mb-6">Your office code links you to today&apos;s orders for your building.</p>

          <div className="flex items-center gap-2.5 bg-green-soft rounded-[11px] p-4 mb-5">
            <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-green flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" />
              </svg>
            </div>
            <div>
              <strong className="text-[12px] block">Got your code from ChopDrop?</strong>
              <span className="text-ink-soft text-[10px]">It was shared when your office was onboarded.</span>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold mb-1.5">Office code</label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="e.g. NORTH-241"
              className="w-full px-3.5 py-3 border border-line rounded-[10px] text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-green/30 uppercase"
            />
          </div>
          {codeError && <p className="text-coral text-[12px] font-semibold mt-2">{codeError}</p>}
          <button type="button" onClick={handleCodeSubmit} className="w-full mt-4 bg-coral text-white font-bold py-3.5 rounded-[10px] text-sm inline-flex items-center justify-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all">
            Open dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-cream">
        <div className="w-8 h-8 border-[3px] border-green border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const handoffSteps = [
    { label: "Orders closed", detail: "Final list locked at 10:30 AM", done: true },
    { label: "Restaurants preparing", detail: `${totalBoxes} of ${totalBoxes} meals accepted`, done: true },
    { label: "Receive lunch drop", detail: "Count boxes before confirming", done: received },
    { label: "Share collection codes", detail: "Workers collect from " + (office?.collectionPoint || "reception"), done: false },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[225px] bg-ink text-white flex-col p-5 z-30">
        <div className="mb-6">
          <Logo size={28} variant="dark" />
        </div>
        <div className="flex items-center gap-2.5 bg-white/[0.08] rounded-[11px] p-3 mb-5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
            <path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" />
          </svg>
          <div>
            <small className="text-[#91a49c] text-[9px] uppercase block">Office desk</small>
            <strong className="text-[12px]">{office?.name}</strong>
          </div>
        </div>
        <nav className="space-y-1">
          <div className="flex items-center gap-2.5 bg-lime/[0.12] text-lime rounded-[10px] px-3 py-2.5 text-[13px] font-bold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Overview
          </div>
        </nav>
        <div className="mt-auto text-[#91a49c] text-[10px]">
          Office code: <strong className="text-white">{office?.code}</strong>
        </div>
      </aside>

      <main className="md:ml-[225px] px-5 md:px-10 py-8 pb-20 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">
              {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">
              {office?.assistantName ? `Good morning, ${office.assistantName.split(" ")[0]}.` : `${office?.name} Dashboard`}
            </h1>
            <p className="text-ink-soft text-[13px] mt-1">
              Today&apos;s lunch drop for {office?.name} &middot; {office?.address}
            </p>
          </div>
          <CountdownTimer cutoffTime="23:59" compact />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Paid orders", value: String(orders.length), note: "Today" },
            { label: "Total boxes", value: String(totalBoxes), note: `${batches.length} restaurant${batches.length !== 1 ? "s" : ""}` },
            { label: "Expected drop", value: "12:30", note: "On schedule", green: true },
            { label: "Distribution fee", value: formatNaira(distributionFee), note: "Paid after handoff" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-paper border border-line rounded-[13px] p-4 ${stat.green ? "border-t-[3px] border-t-green" : ""}`}>
              <span className="text-ink-soft text-[10px] font-bold block">{stat.label}</span>
              <strong className="font-display font-[750] text-[25px] tracking-[-0.04em] block mt-1">{stat.value}</strong>
              <small className="text-ink-soft text-[9px]">{stat.note}</small>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-[1.45fr_0.85fr] gap-4">
          {/* Batch */}
          <div className="bg-paper border border-line rounded-[15px] p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-display font-bold text-[17px]">Today&apos;s drop</div>
                <span className="text-ink-soft text-[10px]">Grouped by restaurant</span>
              </div>
              {orders.length > 0 && (
                <span className="bg-green-soft text-green text-[10px] font-extrabold uppercase tracking-[0.07em] px-2.5 py-1.5 rounded-full">All paid</span>
              )}
            </div>

            {batches.length === 0 ? (
              <div className="text-center py-8 text-ink-soft text-sm">No orders from {office?.name} yet today.</div>
            ) : (
              <>
                {batches.map((batch, idx) => (
                  <div key={batch.restaurant} className="flex items-center gap-3 py-4 border-b border-line">
                    <span className="text-coral font-display font-bold text-[12px] w-6">0{idx + 1}</span>
                    <div className="flex-1">
                      <strong className="text-[12px] block">{batch.restaurant}</strong>
                      <span className="text-ink-soft text-[10px]">
                        {batch.meals.map((m) => `${m.name} × ${m.count}`).join(", ")}
                      </span>
                    </div>
                    <span className="bg-cream text-ink-soft text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                      {batch.totalBoxes} boxes
                    </span>
                  </div>
                ))}
                <div className="flex justify-between mt-4 bg-green-soft rounded-[9px] p-3 text-[11px]">
                  <span>Total expected</span>
                  <strong>{totalBoxes} sealed boxes</strong>
                </div>
              </>
            )}
          </div>

          {/* Handoff */}
          <div className="bg-paper border border-line rounded-[15px] p-5">
            <div className="font-display font-bold text-[17px] mb-4">Handoff checklist</div>
            {handoffSteps.map((step, idx) => (
              <div key={step.label} className="flex gap-3 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  step.done ? "bg-green text-white" : idx === 2 && !received ? "bg-amber text-ink" : "border border-line text-ink-soft"
                }`}>
                  {step.done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                  ) : idx === 2 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div>
                  <strong className="text-[12px] block">{step.label}</strong>
                  <span className="text-ink-soft text-[9px]">{step.detail}</span>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setReceived(!received)}
              className={`w-full mt-3 font-bold py-3 rounded-[10px] text-sm transition-all ${
                received
                  ? "bg-paper border border-line text-ink"
                  : "bg-coral text-white shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038]"
              }`}
            >
              {received ? `Drop received ✓` : `Confirm ${totalBoxes} boxes received`}
            </button>
          </div>
        </div>

        {/* Collection codes */}
        {orders.length > 0 && (
          <div className="bg-paper border border-line rounded-[15px] p-5 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display font-bold text-[17px]">Collection codes</div>
              <span className="text-ink-soft text-[10px]">Pickup at {office?.collectionPoint}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 border border-line rounded-[10px] p-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    order.status === "COMPLETED" ? "bg-green text-white" : "bg-green-soft text-green"
                  }`}>
                    {order.status === "COMPLETED" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l1 14H5L6 7ZM9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-[12px] block truncate">{order.customerName}</strong>
                    <span className="text-ink-soft text-[10px]">{order.dailyMenu.meal.name}</span>
                  </div>
                  <strong className="font-display text-[13px] text-coral">{order.orderCode}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
