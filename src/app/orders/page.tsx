"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

type Tab = "active" | "beg" | "history";

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("active");

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Student · Orders</p>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>My Activity</span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Tabs — 3-way ── */}
      <div className="px-5 mt-4 flex gap-2">
        {([
          ["active", "Active · 4"],
          ["beg", "Beg Price"],
          ["history", "History"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key as Tab)}
            className="h-[25px] px-3 rounded-full text-[11px] font-bold cursor-pointer"
            style={{ background: tab === key ? "#17271F" : "var(--sand)", color: tab === key ? "white" : "var(--text-secondary)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ═══ ACTIVE TAB — urgency-sorted mission ═══ */}
      {/* ═══════════════════════════════════════════ */}
      {tab === "active" && (
        <div className="px-5 mt-4 flex flex-col gap-3">

          {/* ── 1. Ready for pickup — GREEN accent ── */}
          <div className="flex rounded-[22px] overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="w-[5px] shrink-0" style={{ background: "var(--emerald)" }} />
            <div className="flex-1 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full inline-block mb-3" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>
                Ready · Pick up now
              </span>
              <div className="flex items-start gap-3">
                <div className="w-[56px] h-[56px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                  <div className="w-full h-full flex items-center justify-center text-[18px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>E</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[16px] font-extrabold leading-[140%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Ewa Agoyin + Plantain</h4>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Mama T&apos;s · Moremi Hall Gate</p>
                  <p className="text-[18px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "#17271F" }}>{fp(60000)}</p>
                </div>
              </div>
              <p className="text-[11px] mt-2" style={{ color: "var(--emerald)" }}>Vendor marked ready · Collect by 2:30 pm</p>
              <button className="mt-2 w-full h-[42px] rounded-full flex items-center justify-center text-[13px] font-bold cursor-pointer press-feedback" style={{ background: "var(--emerald)", color: "white" }} onClick={() => alert("QR code feature coming soon")}>
                Show QR Code
              </button>
            </div>
          </div>

          {/* ── 2. Beg Price in progress — CORAL accent ── */}
          <div className="flex rounded-[22px] overflow-hidden" style={{ background: "var(--card)" }}>
            <div className="w-[5px] shrink-0" style={{ background: "var(--coral)" }} />
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>Beg Price · Active</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>2h 15m left</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-[56px] h-[56px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                  <div className="w-full h-full flex items-center justify-center text-[18px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>S</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[16px] font-extrabold leading-[140%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Shawarma Special</h4>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Uncle K · Victoria Island</p>
                </div>
              </div>
              {/* Beg price status */}
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[22px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--coral)" }}>{fp(62000)}</span>
                  <span className="text-[12px] line-through tabular-nums ml-1.5" style={{ color: "var(--text-muted)" }}>{fp(80000)}</span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>₦180 saved</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="w-[7px] h-[7px] rounded-full" style={{ background: i < 5 ? "var(--coral)" : "var(--sand)" }} />
                ))}
                <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>5 clicks · floor {fp(50000)}</span>
              </div>
              {/* Pool status */}
              <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span>Pool: 18/25 filling</span>
                <span>⏱ 2h 15m</span>
              </div>
              {/* Two CTAs side by side */}
              <div className="flex gap-2 mt-3">
                <Link href="/beg/sample-code" className="flex-1 h-[40px] rounded-full flex items-center justify-center text-[12px] font-bold press-feedback" style={{ background: "var(--coral)", color: "white" }}>
                  Continue Begging
                </Link>
                <button className="flex-1 h-[40px] rounded-full flex items-center justify-center text-[12px] font-bold cursor-pointer press-feedback" style={{ background: "#17271F", color: "white" }} onClick={() => alert("Paystack checkout at ₦620 coming soon")}>
                  Pay {fp(62000)} Now
                </button>
              </div>
            </div>
          </div>

          {/* ── 3. Pool filling — no accent ── */}
          <div className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: "var(--lime)", color: "#17271F" }}>Pool · Filling</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Today, 12:02</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-[56px] h-[56px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                <div className="w-full h-full flex items-center justify-center text-[18px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>A</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[16px] font-extrabold leading-[140%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Amala + Ewedu</h4>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Mama T&apos;s Kitchen · ★ 4.6</p>
                <p className="text-[18px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "#17271F" }}>{fp(65000)} <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>paid</span></p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-extrabold" style={{ color: "#17271F" }}>
              <span>Filling — 34/35</span>
              <span style={{ color: "var(--coral)" }}>43m left</span>
            </div>
            <div className="mt-1.5 h-[6px] overflow-hidden" style={{ background: "var(--sand)", borderRadius: "9px" }}>
              <div className="h-full" style={{ width: "97%", background: "var(--coral)", borderRadius: "9px" }} />
            </div>
            <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>One more person to fill the pool.</p>
            <div className="flex gap-2 mt-2">
              <Link href="/discover" className="h-[36px] px-4 rounded-full text-[11px] font-bold inline-flex items-center press-feedback" style={{ background: "var(--sand)", color: "#17271F" }}>View Pool</Link>
              <button className="h-[36px] px-4 rounded-full text-[11px] font-bold cursor-pointer press-feedback" style={{ background: "var(--coral)", color: "white" }} onClick={() => { if (navigator.share) navigator.share({ title: "ChopDrop pool", text: "One spot left! Join before it fills.", url: window.location.origin + "/discover" }); }}>Share to Fill</button>
            </div>
          </div>

          {/* ── 4. Food preparing — status only ── */}
          <div className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full inline-block mb-2" style={{ background: "var(--lime)", color: "#17271F" }}>
              Preparing
            </span>
            <div className="flex items-start gap-3">
              <div className="w-[56px] h-[56px] rounded-[12px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                <div className="w-full h-full flex items-center justify-center text-[18px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>J</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[16px] font-extrabold leading-[140%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Jollof Rice + Chicken</h4>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Sisi&apos;s Kitchen · Engineering Gate</p>
                <p className="text-[18px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.5px", color: "#17271F" }}>{fp(90000)}</p>
              </div>
            </div>
            <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>30/30 confirmed · Vendor is cooking. We&apos;ll notify you when it&apos;s ready.</p>
          </div>

          <p className="text-[11px] text-center mt-2" style={{ color: "var(--text-muted)" }}>Sorted by urgency — top needs your attention first</p>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* ═══ BEG PRICE TAB — scoreboard ═══════ */}
      {/* ═══════════════════════════════════════ */}
      {tab === "beg" && (
        <div className="px-5 mt-4">

          {/* ── Lifetime stats ── */}
          <div className="flex gap-2 mb-5">
            {[
              { value: "12", label: "sessions" },
              { value: "₦2,400", label: "saved" },
              { value: "34", label: "clicks" },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 p-3 rounded-[16px] text-center" style={{ background: "var(--card)" }}>
                <p className="text-[20px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{stat.value}</p>
                <p className="text-[10px] font-bold mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Ongoing sessions ── */}
          <h3 className="text-[15px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Ongoing</h3>

          <div className="flex rounded-[22px] overflow-hidden mb-3" style={{ background: "var(--card)" }}>
            <div className="w-[5px] shrink-0" style={{ background: "var(--coral)" }} />
            <div className="flex-1 p-4">
              <h4 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Shawarma Special</h4>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Uncle K · Pool 18/25 · ⏱ 2h 15m</p>
              {/* Price bar */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[11px] font-bold shrink-0" style={{ color: "var(--text-muted)" }}>{fp(80000)}</span>
                <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                  <div className="h-full rounded-full" style={{ width: "62.5%", background: "var(--coral)" }} />
                </div>
                <span className="text-[11px] font-bold shrink-0" style={{ color: "var(--emerald)" }}>{fp(50000)}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-[18px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--coral)" }}>{fp(62000)}</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>5 clicks · ₦180 saved</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href="/beg/sample-code" className="flex-1 h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold press-feedback" style={{ background: "var(--coral)", color: "white" }}>Share Again</Link>
                <button className="flex-1 h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold cursor-pointer press-feedback" style={{ background: "#17271F", color: "white" }} onClick={() => alert("Paystack checkout coming soon")}>Pay {fp(62000)} Now</button>
              </div>
            </div>
          </div>

          {/* ── Completed sessions ── */}
          <h3 className="text-[15px] font-extrabold mt-5 mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Completed</h3>

          <div className="flex flex-col gap-3">
            {[
              { name: "Jollof Rice + Chicken", vendor: "Mama Nkechi", date: "Oct 28", finalPrice: 72000, originalPrice: 90000, clicks: 8, saved: 18000 },
              { name: "Fried Rice + Turkey", vendor: "Mama T Kitchen", date: "Oct 25", finalPrice: 55000, originalPrice: 75000, clicks: 6, saved: 20000 },
              { name: "Pepper Soup", vendor: "Green Bowl Co.", date: "Oct 20", finalPrice: 40000, originalPrice: 48000, clicks: 3, saved: 8000 },
            ].map((s) => (
              <div key={s.name + s.date} className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-[14px] font-bold" style={{ color: "#17271F" }}>{s.name}</h4>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.vendor} · {s.date}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>✓ Paid</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[16px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{fp(s.finalPrice)}</span>
                  <span className="text-[11px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(s.originalPrice)}</span>
                  <span className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>saved {fp(s.saved)}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{s.clicks} friends clicked your link</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* ═══ HISTORY TAB — receipt book ════════ */}
      {/* ═══════════════════════════════════════ */}
      {tab === "history" && (
        <div className="px-5 mt-4">
          <h3 className="text-[15px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Past orders &amp; receipts</h3>
          <div className="flex flex-col gap-3">
            {[
              { name: "Chicken Shawarma", price: 80000, type: "POOL", badge: "Completed", badgeBg: "var(--emerald-soft)", badgeColor: "var(--emerald)", detail: "Collected yesterday · Saved ₦400", begBreakdown: null },
              { name: "Jollof Rice + Chicken", price: 72000, type: "POOL + BEG", badge: "Completed", badgeBg: "var(--emerald-soft)", badgeColor: "var(--emerald)", detail: "Collected Oct 28 · Pool + Beg Price", begBreakdown: { individual: 120000, poolDiscount: 30000, begDiscount: 18000, paid: 72000, totalSaved: 48000, pct: 40 } },
              { name: "Moi Moi + Pap", price: 50000, type: "EXPIRED", badge: "Refunded", badgeBg: "var(--sand)", badgeColor: "var(--text-muted)", detail: "Expired & refunded, 22 Oct", begBreakdown: null },
              { name: "Fried Rice", price: 180000, type: "SOLO", badge: "Completed", badgeBg: "var(--emerald-soft)", badgeColor: "var(--emerald)", detail: "Collected Monday · Full menu price", begBreakdown: null },
            ].map((order) => (
              <div key={order.name + order.type} className="p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
                <div className="flex items-start justify-between">
                  <h4 className="text-[14px] font-bold" style={{ color: "#17271F" }}>{order.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: order.badgeBg, color: order.badgeColor }}>{order.badge}</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{order.detail}</p>

                {order.begBreakdown && (
                  <div className="mt-3 p-3 rounded-[12px] text-[11px]" style={{ background: "var(--bg)" }}>
                    <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Individual price</span><span style={{ color: "#17271F" }}>{fp(order.begBreakdown.individual)}</span></div>
                    <div className="flex justify-between mt-1"><span style={{ color: "var(--text-muted)" }}>Pool discount</span><span style={{ color: "var(--emerald)" }}>-{fp(order.begBreakdown.poolDiscount)}</span></div>
                    <div className="flex justify-between mt-1"><span style={{ color: "var(--text-muted)" }}>Beg Price discount</span><span style={{ color: "var(--emerald)" }}>-{fp(order.begBreakdown.begDiscount)}</span></div>
                    <div className="h-px my-2" style={{ background: "var(--border)" }} />
                    <div className="flex justify-between font-bold"><span style={{ color: "#17271F" }}>You paid</span><span style={{ color: "#17271F" }}>{fp(order.begBreakdown.paid)}</span></div>
                    <p className="text-[10px] font-bold mt-1" style={{ color: "var(--coral)" }}>Total saved: {fp(order.begBreakdown.totalSaved)} ({order.begBreakdown.pct}% off)</p>
                  </div>
                )}

                {!order.begBreakdown && (
                  <p className="text-[14px] font-extrabold tabular-nums mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{fp(order.price)}</p>
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
          <p className="text-[11px] mt-4 text-center" style={{ color: "var(--text-muted)" }}>
            Reorder picks a cheaper live pool when available. Otherwise, order solo.
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
