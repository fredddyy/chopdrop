"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

type Tab = "active" | "history";

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("active");

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Student · Activity</p>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>My Activity</span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Tabs — full width ── */}
      <div className="px-5 mt-4 flex">
        {([
          ["active", "Active"],
          ["history", "History"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key as Tab)}
            className="flex-1 h-[40px] text-[13px] font-bold cursor-pointer rounded-full"
            style={{ background: tab === key ? "#17271F" : "transparent", color: tab === key ? "white" : "var(--text-muted)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══ ACTIVE TAB ═══ */}
      {tab === "active" && (
        <div className="px-5 mt-4">
          <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>
            Track paid pools, cooking orders, pick-up-ready meals, and live campaigns.
          </p>

          {/* Empty state */}
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
            </div>
            <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>No active orders</h3>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Join a pool or order solo — your active orders will appear here.</p>
            <Link href="/discover" className="h-[40px] px-5 rounded-full text-[13px] font-bold text-white inline-flex items-center mt-4 press-feedback" style={{ background: "var(--coral)" }}>Browse deals</Link>
          </div>
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {tab === "history" && (
        <div className="px-5 mt-4">
          {/* Empty state */}
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </div>
            <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>No past orders yet</h3>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Your completed and refunded orders will show here with receipts.</p>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
