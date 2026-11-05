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
          Active · 0
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
        <div className="px-5 mt-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
          </div>
          <h2 className="text-[17px] font-extrabold" style={{ color: "#17271F" }}>No active orders</h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Join a pool or order solo. Track everything here.</p>
          <Link href="/discover" className="mt-4 h-[44px] px-6 rounded-full text-[13px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Browse deals</Link>
        </div>
      ) : (
        <div className="px-5 mt-5">
          <h3 className="text-[17px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Past orders &amp; receipts</h3>
          <div className="flex flex-col items-center text-center mt-8">
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No past orders yet.</p>
            <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>Reorder picks a cheaper live pool when available. Otherwise, order solo.</p>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
