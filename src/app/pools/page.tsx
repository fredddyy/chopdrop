"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

type Tab = "active" | "history";

export default function PoolsPage() {
  const [tab, setTab] = useState<Tab>("active");

  // TODO: fetch real pool data from API when pool system is built
  const activePools: unknown[] = [];
  const pastPools: unknown[] = [];

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Pools</h1>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-1 mb-4">
        {(["active", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="h-[34px] px-4 rounded-[8px] text-[12px] font-bold cursor-pointer transition-all"
            style={{
              background: tab === t ? "var(--dark)" : "var(--sand)",
              color: tab === t ? "white" : "var(--text-secondary)",
            }}
          >
            {t === "active" ? "Active" : "History"}
          </button>
        ))}
      </div>

      {/* Active tab */}
      {tab === "active" && (
        activePools.length > 0 ? (
          <div className="px-5">
            {/* TODO: render active pool cards */}
          </div>
        ) : (
          <div className="flex flex-col items-center pt-12 px-8">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--sand)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-[17px] font-extrabold text-center" style={{ color: "var(--text)" }}>
              No active pools
            </h2>
            <p className="text-[13px] text-center mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              When you start or join a pool, it appears here so you can track who&apos;s joined and when it fills.
            </p>

            {/* How it works — collapsed context */}
            <div className="w-full mt-6 p-4 rounded-[14px]" style={{ background: "var(--sand)" }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: "var(--text)" }}>How pools work</h3>
              <div className="flex flex-col gap-3">
                {[
                  { step: "1", text: "Tap \"Pool & Save\" on any product" },
                  { step: "2", text: "Share the link — more people = lower price" },
                  { step: "3", text: "Pool fills? Everyone pays the group price. Didn't fill? Full refund." },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-2.5">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                      style={{ background: "var(--text-muted)" }}
                    >
                      {s.step}
                    </span>
                    <span className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/discover"
              className="mt-5 h-[44px] px-6 rounded-[12px] text-[13px] font-bold text-white inline-flex items-center"
              style={{ background: "var(--coral)" }}
            >
              Browse stores
            </Link>
          </div>
        )
      )}

      {/* History tab */}
      {tab === "history" && (
        pastPools.length > 0 ? (
          <div className="px-5">
            {/* TODO: render past pool cards */}
          </div>
        ) : (
          <div className="flex flex-col items-center pt-12 px-8">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--sand)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2 className="text-[17px] font-extrabold text-center" style={{ color: "var(--text)" }}>
              No pool history yet
            </h2>
            <p className="text-[13px] text-center mt-1" style={{ color: "var(--text-muted)" }}>
              Your completed and expired pools will show here.
            </p>
          </div>
        )
      )}

      <BottomNav />
    </main>
  );
}
