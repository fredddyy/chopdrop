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
  memberCount: number;
  ordererNames: string[];
  menuItems: string[];
  orders: OrderItem[];
  batches: BatchGroup[];
  totalBoxes: number;
  totalRevenue: number;
}

export function CaptainDashboard({
  office,
  memberCount,
  ordererNames,
  menuItems,
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

        {/* Send Reminder + Nudge */}
        <div className="flex gap-2.5 mb-5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `🍚 Lunch pool is open!\n\nToday's options:\n${menuItems.map((m) => `• ${m}`).join("\n")}\n\nOrder before 12:00!\n${typeof window !== "undefined" ? window.location.origin : ""}/join/${office.slug}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#25d366] text-white font-bold text-[12px] py-3 rounded-[10px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Send Reminder
          </a>
          {ordererNames.length > 0 && memberCount > ordererNames.length && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${ordererNames.length} people already ordered lunch! Pool closes soon. Don't miss out 🍽️\n\nOrder here: ${typeof window !== "undefined" ? window.location.origin : ""}/join/${office.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#f5c565] text-[#5a3e00] font-bold text-[12px] py-3 rounded-[10px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              Nudge ({memberCount - ordererNames.length} left)
            </a>
          )}
        </div>

        {/* Captain Earnings */}
        <div className="bg-paper border border-line rounded-[14px] p-4 mb-5">
          <div className="font-display font-bold text-[13px] mb-3">Your earnings today</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-soft">Free lunch</span>
              <span className={`font-bold ${totalBoxes >= 15 ? "text-green" : "text-ink-soft"}`}>
                {totalBoxes >= 15 ? "✓ Unlocked!" : `${15 - totalBoxes} more orders needed`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-soft">Pool bonus (20+ orders)</span>
              <span className={`font-bold ${totalBoxes >= 20 ? "text-coral" : "text-ink-soft"}`}>
                {totalBoxes >= 20 ? formatNaira(50000) : `${20 - totalBoxes} more needed`}
              </span>
            </div>
            {totalBoxes >= 15 && (
              <div className="h-[3px] rounded-full bg-green mt-1" />
            )}
            {totalBoxes > 0 && totalBoxes < 15 && (
              <div className="h-[3px] rounded-full bg-line mt-1 overflow-hidden">
                <div className="h-full bg-amber rounded-full transition-all" style={{ width: `${Math.min(100, (totalBoxes / 15) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Who ordered / who hasn't */}
        {ordererNames.length > 0 && (
          <div className="bg-paper border border-line rounded-[14px] p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-[13px]">Who ordered</span>
              <span className="text-[10px] text-ink-soft font-bold">{ordererNames.length}/{memberCount}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ordererNames.map((name) => (
                <span key={name} className="text-[10px] font-medium bg-green-soft text-green px-2 py-0.5 rounded-full">✓ {name}</span>
              ))}
            </div>
          </div>
        )}

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
