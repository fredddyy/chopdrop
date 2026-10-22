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

  const firstName = office.assistantName?.split(" ")[0] || "Captain";
  const distributionFee = totalBoxes * 15000;
  const freeLunchProgress = Math.min(100, (totalBoxes / 15) * 100);
  const bonusProgress = Math.min(100, (totalBoxes / 20) * 100);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handoffSteps = [
    { label: "Orders closed", done: true },
    { label: "Preparing", done: true },
    { label: "Received", done: received },
    { label: "Distribute", done: false },
  ];

  return (
    <div className="min-h-svh" style={{ background: "var(--bg)" }}>
      {/* ── Header ── */}
      <header style={{ background: "var(--dark)" }}>
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <Logo size={24} variant="white" />
            <div className="flex items-center gap-2 bg-white/[0.08] rounded-full px-3.5 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--gold)]"><path d="M4 21V4h11v17M15 9h5v12" /></svg>
              <span className="text-[13px] font-semibold text-white">{office.name}</span>
            </div>
          </div>
          <div className="text-[13px] font-semibold text-white/40 uppercase tracking-wide">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="text-[28px] font-extrabold text-white tracking-[-0.02em] mt-1">
            Hey {firstName}
          </h1>
          <p className="text-[15px] text-white/50 mt-1">
            {orders.length > 0
              ? `${totalBoxes} boxes heading to ${office.collectionPoint} today`
              : "No orders yet. Check back after 10:30 AM."}
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 -mt-1 pb-8">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { value: String(orders.length), label: "Orders", color: "var(--text)" },
            { value: String(totalBoxes), label: "Boxes", color: "var(--emerald)" },
            { value: formatNaira(distributionFee), label: "Your fee", color: "var(--coral)" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-[16px] p-4 text-center" style={{ border: "1px solid var(--border)" }}>
              <div className="text-[24px] font-extrabold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[13px] text-[var(--text-secondary)] mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Send Reminder ── */}
        <div className="flex gap-3 mb-5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Lunch pool is open!\n\nToday's options:\n${menuItems.map((m) => `• ${m}`).join("\n")}\n\nOrder before 12:00!\n${appUrl}/join/${office.slug}`
            )}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 bg-[#25d366] text-white font-bold text-[14px] h-[48px] rounded-full flex items-center justify-center gap-2 active:scale-[0.97] transition-transform hover:bg-[#20bd5a]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Send Reminder
          </a>
          {ordererNames.length > 0 && memberCount > ordererNames.length && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${ordererNames.length} people already ordered lunch! Pool closes soon.\n\nOrder here: ${appUrl}/join/${office.slug}`
              )}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-[var(--gold)] text-white font-bold text-[14px] h-[48px] rounded-full flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              Nudge {memberCount - ordererNames.length} left
            </a>
          )}
        </div>

        {/* ── Captain earnings ── */}
        <div className="bg-white rounded-[20px] p-5 mb-5" style={{ border: "1px solid var(--border)" }}>
          <div className="text-[16px] font-bold text-[var(--text)] mb-4">Your earnings today</div>
          {/* Free lunch */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] text-[var(--text-secondary)]">Free lunch</span>
              <span className={`text-[14px] font-bold ${totalBoxes >= 15 ? "text-[var(--emerald)]" : "text-[var(--text-muted)]"}`}>
                {totalBoxes >= 15 ? "Unlocked" : `${15 - totalBoxes} more needed`}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${freeLunchProgress}%`, background: totalBoxes >= 15 ? "var(--emerald)" : "var(--gold)" }} />
            </div>
          </div>
          {/* Pool bonus */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] text-[var(--text-secondary)]">Pool bonus (20+ orders)</span>
              <span className={`text-[14px] font-bold ${totalBoxes >= 20 ? "text-[var(--coral)]" : "text-[var(--text-muted)]"}`}>
                {totalBoxes >= 20 ? formatNaira(50000) : `${20 - totalBoxes} more`}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${bonusProgress}%`, background: totalBoxes >= 20 ? "var(--coral)" : "var(--border)" }} />
            </div>
          </div>
        </div>

        {/* ── Handoff tracker ── */}
        <div className="bg-white rounded-[20px] p-5 mb-5" style={{ border: "1px solid var(--border)" }}>
          <div className="text-[16px] font-bold text-[var(--text)] mb-4">Handoff</div>
          <div className="flex gap-2 mb-5">
            {handoffSteps.map((step, idx) => (
              <div key={step.label} className="flex-1">
                <div className="h-2 rounded-full" style={{
                  background: step.done ? "var(--emerald)" : idx === 2 && !received ? "var(--gold)" : "var(--sand)",
                }} />
                <span className="text-[11px] mt-1.5 block font-medium" style={{
                  color: step.done ? "var(--emerald)" : "var(--text-muted)",
                }}>{step.label}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleConfirmReceived}
            disabled={received}
            className={`w-full font-bold text-[15px] h-[48px] rounded-full transition-all cursor-pointer ${
              received
                ? "bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/20"
                : "bg-[var(--coral)] text-white hover:bg-[var(--coral-dark)] active:scale-[0.97]"
            } disabled:cursor-default`}
          >
            {received
              ? `Drop received at ${receivedTime}`
              : `Confirm ${totalBoxes} boxes received`}
          </button>
        </div>

        {/* ── Who ordered ── */}
        {ordererNames.length > 0 && (
          <div className="bg-white rounded-[20px] p-5 mb-5" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[16px] font-bold text-[var(--text)]">Who ordered</span>
              <span className="text-[14px] font-bold text-[var(--text-secondary)]">{ordererNames.length}/{memberCount}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ordererNames.map((name) => (
                <span key={name} className="text-[13px] font-medium bg-[var(--emerald)]/10 text-[var(--emerald)] px-3 py-1 rounded-full flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab switcher ── */}
        <div className="flex gap-2 mb-4">
          {(["batch", "codes"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 h-[44px] rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                tab === t
                  ? "bg-[var(--dark)] text-white"
                  : "bg-white text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-muted)]"
              }`}
            >
              {t === "batch" ? `Drop (${batches.length})` : `Codes (${orders.length})`}
            </button>
          ))}
        </div>

        {/* ── Batch tab ── */}
        {tab === "batch" && (
          <div className="bg-white rounded-[20px] p-5" style={{ border: "1px solid var(--border)" }}>
            {batches.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-muted)] text-[15px]">No orders yet.</div>
            ) : (
              <>
                {batches.map((batch) => (
                  <div key={batch.restaurant} className="flex items-center gap-3 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="w-10 h-10 rounded-full bg-[var(--coral)]/10 flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[var(--text)] truncate">{batch.restaurant}</div>
                      <div className="text-[13px] text-[var(--text-secondary)]">
                        {batch.meals.map((m) => `${m.name} x${m.count}`).join(", ")}
                      </div>
                    </div>
                    <div className="text-[18px] font-extrabold text-[var(--text)] tabular-nums">{batch.totalBoxes}</div>
                  </div>
                ))}
                <div className="flex justify-between items-center mt-4 bg-[var(--emerald)]/10 rounded-[12px] p-4">
                  <span className="text-[14px] font-semibold text-[var(--emerald)]">Total</span>
                  <span className="text-[18px] font-extrabold text-[var(--emerald)] tabular-nums">{totalBoxes} boxes</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Codes tab ── */}
        {tab === "codes" && (
          <div className="space-y-2">
            {orders.length === 0 ? (
              <div className="bg-white rounded-[20px] p-5 text-center py-10 text-[var(--text-muted)] text-[15px]" style={{ border: "1px solid var(--border)" }}>
                No orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-[16px] p-4 flex items-center gap-3" style={{ border: "1px solid var(--border)" }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    order.status === "COMPLETED" ? "bg-[var(--emerald)] text-white" : "bg-[var(--emerald)]/10 text-[var(--emerald)]"
                  }`}>
                    {order.status === "COMPLETED" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l1 14H5L6 7ZM9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[var(--text)] truncate">{order.customerName}</div>
                    <div className="text-[13px] text-[var(--text-secondary)]">{order.mealName} · {order.restaurantName}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[17px] font-extrabold text-[var(--coral)] tabular-nums">{order.orderCode}</div>
                    <div className="text-[12px] text-[var(--text-muted)]">{formatNaira(order.totalAmount)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-[13px] text-[var(--text-muted)]">
            Office code: <span className="font-bold text-[var(--text)]">{office.code}</span> · {office.address}
          </p>
          <p className="text-[13px] text-[var(--text-muted)]">
            Collection point: <span className="font-bold text-[var(--text)]">{office.collectionPoint}</span>
          </p>
          <p className="text-[12px] text-[var(--text-muted)] mt-3">Bookmark this page for daily access</p>
        </div>
      </div>
    </div>
  );
}
