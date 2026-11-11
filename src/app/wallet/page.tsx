"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

function txIcon(type: string) {
  const stroke = "var(--emerald)";
  if (type === "SCRATCH_WIN") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
  if (type === "POOL_REFUND" || type === "GROUP_DISCOUNT") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
  if (type === "APPLIED") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /></svg>;
}

function txLabel(type: string): string {
  if (type === "SCRATCH_WIN") return "Scratch card win";
  if (type === "POOL_REFUND") return "Pool refund";
  if (type === "GROUP_DISCOUNT") return "Group order discount";
  if (type === "APPLIED") return "Credit used at checkout";
  if (type === "MANUAL") return "Manual credit";
  return type;
}

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setBalance(d.data.balance);
          setTransactions(d.data.transactions || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const earned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Wallet</p>
          <p className="text-[14px] font-extrabold" style={{ color: "var(--text)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Your meal credit</p>
        </div>
        <div className="w-11" />
      </div>

      {/* ── Balance card ── */}
      <div className="px-5 mt-5">
        <div className="rounded-[16px] p-5" style={{ background: "var(--dark)" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)" }}>Available store credit</p>
          {loading ? (
            <div className="h-[44px] w-[140px] rounded-[8px] mt-2" style={{ background: "rgba(255,255,255,0.1)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ) : (
            <p className="text-[44px] font-extrabold tabular-nums leading-none mt-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "white" }}>{fp(balance)}</p>
          )}
          <p className="text-[12px] mt-2" style={{ color: "var(--subdued)" }}>Meal credit, not cash. Applied automatically at checkout.</p>
        </div>
      </div>

      {/* ── Credit history ── */}
      <div className="px-5 mt-6">
        <h2 className="text-[18px] font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Credit history</h2>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[60px] rounded-[12px]" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>No transactions yet</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Earn credit from scratch cards, pool refunds, and group discounts.</p>
          </div>
        ) : (
          <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {transactions.map((tx, i) => (
              <div key={tx.id}>
                {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0" style={{ background: tx.amount > 0 ? "var(--emerald-soft)" : "var(--sand)" }}>
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{txLabel(tx.type)}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {tx.description || new Date(tx.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className="text-[14px] font-extrabold tabular-nums shrink-0" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: tx.amount > 0 ? "var(--emerald)" : "var(--text)" }}>
                    {tx.amount > 0 ? "+" : ""}{fp(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Summary ── */}
      {!loading && transactions.length > 0 && (
        <div className="px-5 mt-5">
          <div className="p-4 rounded-[16px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between text-[13px] mb-2">
              <span style={{ color: "var(--text-muted)" }}>Total earned</span>
              <span className="font-bold" style={{ color: "var(--emerald)" }}>+{fp(earned)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-2">
              <span style={{ color: "var(--text-muted)" }}>Total spent</span>
              <span className="font-bold" style={{ color: "var(--text)" }}>{spent > 0 ? `−${fp(spent)}` : fp(0)}</span>
            </div>
            <div className="h-px my-2" style={{ background: "var(--border)" }} />
            <div className="flex justify-between text-[15px] font-extrabold">
              <span style={{ color: "var(--text)" }}>Balance</span>
              <span className="tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fp(balance)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="px-5 mt-5 mb-4">
        <Link href="/rewards" className="w-full h-[50px] rounded-full flex items-center justify-center text-[14px] font-bold press-feedback" style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}>
          Earn more credit
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
