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
      <div className="px-5 mt-4 flex gap-2">
        <button type="button" onClick={() => setTab("active")}
          className="h-[25px] px-3 rounded-full text-[11px] font-bold cursor-pointer"
          style={{ background: tab === "active" ? "#17271F" : "var(--sand)", color: tab === "active" ? "white" : "var(--text-secondary)" }}>
          Active · 4
        </button>
        <button type="button" onClick={() => setTab("past")}
          className="h-[25px] px-3 rounded-full text-[11px] font-bold cursor-pointer"
          style={{ background: tab === "past" ? "#17271F" : "var(--sand)", color: tab === "past" ? "white" : "var(--text-secondary)" }}>
          Past orders
        </button>
      </div>

      <p className="px-5 mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
        Every pool you joined and every solo order you made.
      </p>

      {tab === "active" ? (
        <div className="px-5 mt-4 flex flex-col gap-4">

          {/* ── Beg Price Pool — share to reduce your price ── */}
          <div className="p-4 rounded-[22px]" style={{ background: "#17271F" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: "var(--lime)", color: "#17271F" }}>Beg Price · Active</span>
              <span className="text-[11px]" style={{ color: "var(--subdued)" }}>Today, 11:45</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-[60px] h-[60px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                <div className="w-full h-full flex items-center justify-center text-[20px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>J</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[17px] font-extrabold leading-[145%] text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Jollof Rice + Chicken</h4>
                <p className="text-[12px]" style={{ color: "var(--subdued)" }}>The Place · Ikeja GRA</p>
              </div>
            </div>
            {/* Price breakdown */}
            <div className="mt-3 p-3 rounded-[14px]" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--lime)" }}>Your price right now</p>
                  <p className="text-[28px] font-extrabold tabular-nums leading-none mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--lime)" }}>{fp(72000)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] line-through tabular-nums" style={{ color: "var(--subdued)" }}>{fp(90000)}</p>
                  <p className="text-[11px] font-bold mt-0.5" style={{ color: "var(--coral)" }}>₦180 saved so far</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-[8px] h-[8px] rounded-full" style={{ background: i < 3 ? "var(--lime)" : "rgba(255,255,255,0.12)" }} />
                ))}
                <span className="text-[10px] ml-1" style={{ color: "var(--subdued)" }}>3 of 8 clicks</span>
              </div>
            </div>
            {/* Pool progress */}
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold" style={{ color: "white" }}>
              <span>18/30 plates claimed</span>
              <span style={{ color: "var(--lime)" }}>2h 15m left</span>
            </div>
            <div className="mt-1.5 h-[5px] overflow-hidden" style={{ background: "rgba(255,255,255,0.15)", borderRadius: "9px" }}>
              <div className="h-full" style={{ width: "60%", background: "var(--lime)", borderRadius: "9px" }} />
            </div>
            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Link href="/beg/sample-code" className="flex-1 h-[42px] rounded-full flex items-center justify-center gap-2 text-[13px] font-bold press-feedback" style={{ background: "#25D366", color: "white" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" /></svg>
                Share to save more
              </Link>
              <Link href="/beg/sample-code" className="h-[42px] px-4 rounded-full flex items-center justify-center text-[13px] font-bold press-feedback" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
                View
              </Link>
            </div>
            <p className="text-[10px] mt-2 text-center" style={{ color: "var(--subdued)" }}>Share your link — each click reduces your price</p>
          </div>

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
          <h3 className="text-[17px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Past orders &amp; receipts</h3>
          <div className="flex flex-col gap-3">
            {[
              { name: "Chicken Shawarma", price: 80000, type: "POOL", detail: "Collected yesterday · Saved ₦400", hasSaved: true },
              { name: "Moi Moi + Pap", price: 50000, type: "EXPIRED", detail: "Expired & refunded, 22 Oct", hasSaved: false },
              { name: "Fried Rice", price: 180000, type: "SOLO", detail: "Collected Monday · Full menu price", hasSaved: false },
            ].map((order) => (
              <div key={order.name} className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
                <h4 className="text-[14px] font-bold" style={{ color: "#17271F" }}>{order.name} · {fp(order.price)}</h4>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {order.type} · {order.detail}
                </p>
                {order.type !== "EXPIRED" && (
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {order.type === "SOLO" ? "Collected Monday · Full menu price" : ""}
                  </p>
                )}
                {order.type === "EXPIRED" && (
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Returned to original payment source</p>
                )}
                <div className="flex gap-2 mt-3">
                  {order.type !== "EXPIRED" && (
                    <Link href="/discover" className="h-[32px] px-4 rounded-full text-[11px] font-bold inline-flex items-center press-feedback" style={{ background: "var(--coral)", color: "white" }}>Reorder</Link>
                  )}
                  <button className="h-[32px] px-4 rounded-full text-[11px] font-bold cursor-pointer press-feedback" style={{ background: "var(--sand)", color: "#17271F" }} onClick={() => alert("Receipt feature coming soon")}>Receipt</button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-4" style={{ color: "var(--text-muted)" }}>
            Reorder picks a cheaper live pool when available. Otherwise, order solo.
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
