"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/utils";
import { Logo } from "@/components/logo";

interface OrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  status: string;
  totalAmount: number;
  quantity: number;
  mealName: string;
  restaurantName: string;
}

interface BatchGroup {
  restaurant: string;
  meals: { name: string; count: number }[];
  totalBoxes: number;
}

interface CaptainDashboardProps {
  office: {
    id: string;
    name: string;
    code: string;
    slug: string;
    address: string;
    collectionPoint: string;
    assistantName: string | null;
  };
  orders: OrderItem[];
  batches: BatchGroup[];
  totalBoxes: number;
  totalRevenue: number;
}

export function CaptainDashboard({
  office,
  orders,
  batches,
  totalBoxes,
  totalRevenue,
}: CaptainDashboardProps) {
  const [received, setReceived] = useState(false);
  const [receivedTime, setReceivedTime] = useState("");
  const [tab, setTab] = useState<"batch" | "codes">("batch");

  function handleConfirmReceived() {
    setReceived(true);
    setReceivedTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  }

  const firstName = office.assistantName?.split(" ")[0] || "ChopDropper";
  const distributionFee = totalBoxes * 15000; // ₦150 per box

  const handoffSteps = [
    { label: "Orders closed", detail: "Final list locked at 10:30 AM", done: true },
    { label: "Kitchens preparing", detail: `${totalBoxes} meals accepted`, done: true },
    { label: "Receive drop", detail: "Count boxes before confirming", done: received },
    { label: "Distribute", detail: `Hand out at ${office.collectionPoint}`, done: false },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header — simple, no sidebar on mobile */}
      <header className="bg-ink text-white px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <Logo size={28} variant="dark" />
            <div className="flex items-center gap-2 bg-white/[0.08] rounded-[10px] px-3 py-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
                <path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" />
              </svg>
              <span className="text-[11px] font-semibold">{office.name}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-lime text-[9px] font-extrabold uppercase tracking-[0.13em]">
              {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 className="font-display font-bold text-[24px] tracking-[-0.04em] mt-1">
              Hey {firstName} 👋
            </h1>
            <p className="text-[#b8c6c1] text-[13px] mt-1">
              {orders.length > 0
                ? `${totalBoxes} boxes coming to ${office.collectionPoint} today.`
                : "No orders yet for today. Check back after 10:30 AM."}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-5">
        {/* Stats — compact row */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-paper border border-line rounded-[12px] p-3 text-center">
            <strong className="font-display font-[750] text-[22px] block">{orders.length}</strong>
            <span className="text-ink-soft text-[9px] font-bold">Orders</span>
          </div>
          <div className="bg-paper border border-line rounded-[12px] p-3 text-center border-t-[3px] border-t-green">
            <strong className="font-display font-[750] text-[22px] block">{totalBoxes}</strong>
            <span className="text-ink-soft text-[9px] font-bold">Boxes</span>
          </div>
          <div className="bg-paper border border-line rounded-[12px] p-3 text-center">
            <strong className="font-display font-[750] text-[22px] block">{formatNaira(distributionFee)}</strong>
            <span className="text-ink-soft text-[9px] font-bold">Your fee</span>
          </div>
        </div>

        {/* Handoff Steps */}
        <div className="bg-paper border border-line rounded-[14px] p-4 mb-5">
          <div className="font-display font-bold text-[15px] mb-3">Handoff</div>
          <div className="flex gap-1.5 mb-4">
            {handoffSteps.map((step, idx) => (
              <div key={step.label} className="flex-1">
                <div className={`h-1.5 rounded-full ${step.done ? "bg-green" : idx === 2 && !received ? "bg-amber" : "bg-line"}`} />
                <span className={`text-[8px] mt-1 block ${step.done ? "text-green font-bold" : "text-ink-soft"}`}>{step.label}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleConfirmReceived}
            disabled={received}
            className={`w-full font-bold py-3 rounded-[10px] text-sm transition-all ${
              received
                ? "bg-green-soft text-green border border-green/20"
                : "bg-coral text-white shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038]"
            }`}
          >
            {received
              ? `✓ Drop received at ${receivedTime}`
              : `Confirm ${totalBoxes} boxes received`}
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab("batch")}
            className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold transition-colors ${
              tab === "batch" ? "bg-ink text-white" : "bg-paper border border-line text-ink-soft"
            }`}
          >
            Drop ({batches.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("codes")}
            className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold transition-colors ${
              tab === "codes" ? "bg-ink text-white" : "bg-paper border border-line text-ink-soft"
            }`}
          >
            Codes ({orders.length})
          </button>
        </div>

        {/* Batch Tab */}
        {tab === "batch" && (
          <div className="bg-paper border border-line rounded-[14px] p-4">
            {batches.length === 0 ? (
              <div className="text-center py-8 text-ink-soft text-sm">No orders yet.</div>
            ) : (
              <>
                {batches.map((batch, idx) => (
                  <div key={batch.restaurant} className="flex items-center gap-3 py-3.5 border-b border-line last:border-b-0">
                    <span className="text-coral font-display font-bold text-[11px] w-5">{idx + 1}</span>
                    <div className="flex-1">
                      <strong className="text-[12px] block">{batch.restaurant}</strong>
                      <span className="text-ink-soft text-[10px]">
                        {batch.meals.map((m) => `${m.name} × ${m.count}`).join(", ")}
                      </span>
                    </div>
                    <span className="bg-cream text-ink-soft text-[10px] font-extrabold px-2 py-1 rounded-full">
                      {batch.totalBoxes}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between mt-3 bg-green-soft rounded-[9px] p-3 text-[11px]">
                  <span>Total</span>
                  <strong>{totalBoxes} boxes</strong>
                </div>
              </>
            )}
          </div>
        )}

        {/* Codes Tab */}
        {tab === "codes" && (
          <div className="space-y-2">
            {orders.length === 0 ? (
              <div className="bg-paper border border-line rounded-[14px] p-4 text-center py-8 text-ink-soft text-sm">
                No orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-paper border border-line rounded-[12px] p-3.5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                    order.status === "COMPLETED" ? "bg-green text-white" : "bg-green-soft text-green"
                  }`}>
                    {order.status === "COMPLETED" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l1 14H5L6 7ZM9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-[13px] block truncate">{order.customerName}</strong>
                    <span className="text-ink-soft text-[10px]">{order.mealName} &middot; {order.restaurantName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <strong className="font-display text-[15px] text-coral block">{order.orderCode}</strong>
                    <span className="text-[9px] text-ink-soft">{formatNaira(order.totalAmount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 text-center text-ink-soft text-[10px] space-y-1">
          <p>Office code: <strong className="text-ink">{office.code}</strong> &middot; {office.address}</p>
          <p>Collection: <strong className="text-ink">{office.collectionPoint}</strong></p>
          <p className="mt-3">Bookmark this page for instant access every day.</p>
        </div>
      </div>
    </div>
  );
}
