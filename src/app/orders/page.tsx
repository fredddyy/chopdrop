"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

type Tab = "active" | "past";

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("active");

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Orders</p>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>My orders</span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Title ── */}
      <div className="px-5 mt-4">
        <h1 className="text-[28px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "#17271F" }}>Order history</h1>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 mt-4 flex">
        {([["active", "Active · 4"], ["past", "Past orders"]] as const).map(([key, label]) => (
          <button
            key={key} type="button" onClick={() => setTab(key as Tab)}
            className="flex-1 h-[40px] text-[13px] font-bold cursor-pointer rounded-full"
            style={{ background: tab === key ? "#17271F" : "transparent", color: tab === key ? "white" : "var(--text-muted)" }}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="px-5 mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Every pool you joined and every solo order you made.
      </p>

      {tab === "active" ? (
        <div className="px-5 mt-4 flex flex-col gap-4">

          {/* ── Order 1: Ready / Pick up now ── */}
          <div className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full inline-block mb-3" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
              Ready / Pick up now
            </span>
            <div className="flex items-start gap-3">
              <div className="w-[60px] h-[60px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                <div className="w-full h-full flex items-center justify-center text-[20px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>E</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[17px] font-extrabold leading-[145%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Ewa Agoyin + Plantain</h4>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Mama T&apos;s · Moremi Hall Gate</p>
                <p className="text-[20px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "#17271F" }}>{fp(60000)}</p>
              </div>
            </div>
            <p className="text-[12px] mt-3" style={{ color: "var(--text-muted)" }}>Vendor marked ready · Collect by 2:30 pm</p>
            <button className="mt-2 h-[38px] rounded-full flex items-center justify-center px-5 text-[13px] font-bold cursor-pointer press-feedback" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }} onClick={() => alert("QR code feature coming soon")}>
              Show QR code
            </button>
          </div>

          {/* ── Order 2: Pool · Filling ── */}
          <div className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: "var(--lime)", color: "#17271F" }}>Pool · Filling</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Today, 0:00</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-[60px] h-[60px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                <div className="w-full h-full flex items-center justify-center text-[20px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>A</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[17px] font-extrabold leading-[145%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Amala + Ewedu</h4>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Mama T&apos;s Kitchen · <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--text-muted)" stroke="none" className="inline-block -mt-px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> 4.6</p>
                <p className="text-[20px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "#17271F" }}>{fp(65000)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold" style={{ color: "#17271F" }}>
              <span>Filling — 34/35</span>
              <span style={{ color: "var(--coral)" }}>43m left</span>
            </div>
            <div className="mt-1.5 h-[7px] overflow-hidden" style={{ background: "var(--sand)", borderRadius: "9px" }}>
              <div className="h-full" style={{ width: "97%", background: "var(--coral)", borderRadius: "9px" }} />
            </div>
            <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>You&apos;re paid in. One more person to fill the pool.</p>
            <button className="mt-2 text-[12px] font-bold cursor-pointer" style={{ color: "var(--coral)" }} onClick={() => { if (navigator.share) navigator.share({ title: "ChopDrop pool", text: "One spot left! Join before it fills.", url: window.location.origin + "/discover" }); }}>Share the last spot →</button>
          </div>

          {/* ── Beg Price · Active — same card style, beg pill + dual CTAs ── */}
          <div className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>Beg Price · Active</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Today, 11:45</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-[60px] h-[60px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                <div className="w-full h-full flex items-center justify-center text-[20px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>S</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[17px] font-extrabold leading-[145%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Shawarma Special</h4>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Uncle K · Victoria Island</p>
                <p className="text-[20px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "var(--coral)" }}>{fp(62000)} <span className="text-[12px] line-through" style={{ color: "var(--text-muted)" }}>{fp(80000)}</span></p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold" style={{ color: "#17271F" }}>
              <span>5 clicks · ₦180 saved</span>
              <span style={{ color: "var(--coral)" }}>2h 15m left</span>
            </div>
            <div className="mt-1.5 h-[7px] overflow-hidden" style={{ background: "var(--sand)", borderRadius: "9px" }}>
              <div className="h-full" style={{ width: "60%", background: "var(--coral)", borderRadius: "9px" }} />
            </div>
            <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>Pool: 18/25 filling. Share more to drop your price further.</p>
            <div className="flex gap-2 mt-2">
              <Link href="/beg/sample-code" className="flex-1 h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold press-feedback" style={{ background: "var(--coral)", color: "white" }}>Continue Begging</Link>
              <button className="flex-1 h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold cursor-pointer press-feedback" style={{ background: "#17271F", color: "white" }} onClick={() => alert("Paystack checkout at ₦620 coming soon")}>Pay {fp(62000)} Now</button>
            </div>
          </div>

          {/* ── Order 3: Filled · Cooking ── */}
          <div className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full inline-block mb-3" style={{ background: "var(--lime)", color: "#17271F" }}>
              Filled · Cooking
            </span>
            <div className="flex items-start gap-3">
              <div className="w-[60px] h-[60px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                <div className="w-full h-full flex items-center justify-center text-[20px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>J</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[17px] font-extrabold leading-[145%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Jollof Rice + Chicken</h4>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Sisi&apos;s Kitchen · Engineering Gate</p>
                <p className="text-[20px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "#17271F" }}>{fp(90000)}</p>
              </div>
            </div>
            <p className="text-[12px] mt-3" style={{ color: "var(--text-muted)" }}>30/30 plates confirmed. Vendor has started cooking. We&apos;ll alert you when it&apos;s ready.</p>
            <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>Earlier order · Today, 7:03</p>
          </div>
        </div>
      ) : (
        <div className="px-5 mt-5">
          <h3 className="text-[17px] font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Past orders &amp; receipts</h3>
          {[
            { name: "Chicken Shawarma", price: 80000, type: "POOL", detail: "Collected yesterday · Saved ₦400", expired: false },
            { name: "Moi Moi + Pap", price: 50000, type: "EXPIRED", detail: "Expired unfilled · ₦500 refunded, 22 Oct", expired: true },
            { name: "Fried Rice", price: 180000, type: "SOLO", detail: "Collected Monday · Full menu price", expired: false },
          ].map((order, i, arr) => (
            <div key={order.name}>
              <div className="py-3">
                <h4 className="text-[14px] font-bold" style={{ color: "#17271F" }}>{order.name} · {fp(order.price)}</h4>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{order.type} · {order.detail}</p>
                {order.expired && (
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Returned to original payment source</p>
                )}
                <div className="flex gap-2 mt-2.5">
                  {!order.expired && (
                    <Link href="/discover" className="h-[32px] px-4 rounded-full text-[11px] font-bold inline-flex items-center press-feedback" style={{ background: "var(--coral)", color: "white" }}>Reorder</Link>
                  )}
                  <button className="h-[32px] px-4 rounded-full text-[11px] font-bold cursor-pointer press-feedback" style={{ background: "var(--sand)", color: "#17271F" }} onClick={() => alert("Receipt feature coming soon")}>Receipt</button>
                </div>
              </div>
              {i < arr.length - 1 && <div className="h-px" style={{ background: "var(--border)" }} />}
            </div>
          ))}
          <p className="text-[11px] mt-4" style={{ color: "var(--text-muted)" }}>
            Reorder picks a cheaper live pool when available. Otherwise, order solo.
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
