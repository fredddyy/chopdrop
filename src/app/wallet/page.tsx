"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

// Sample credit history — will be replaced with API data
const HISTORY = [
  { iconType: "scratch", label: "Daily scratch win", date: "5 Nov · Today's revealed reward", amount: 10000, positive: true },
  { iconType: "star", label: "Review reward conversion", date: "3 Nov · Points converted to credit", amount: 6000, positive: true },
  { iconType: "cart", label: "Credit used at checkout", date: "2 Nov · Order CC-EW-102", amount: -35000, positive: false },
  { iconType: "scratch", label: "Daily scratch wins", date: "1 Nov · Earlier scratch rewards", amount: 20000, positive: true },
  { iconType: "gift", label: "Referral bonuses", date: "31 Oct–5 Nov · 5 friends × ₦200", amount: 100000, positive: true },
];

function HistoryIcon({ type }: { type: string }) {
  const stroke = "var(--emerald)";
  if (type === "scratch") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
  if (type === "star") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
  if (type === "cart") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  if (type === "gift") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /></svg>;
}

export default function WalletPage() {
  const router = useRouter();

  const balance = 101000; // kobo — ₦1,010
  const earned = 136000;
  const spent = 35000;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Me · Wallet</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#1C1C1E", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Your next chop has backup</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Balance card — dark ── */}
      <div className="px-5 mt-5">
        <div className="rounded-[22px] p-5" style={{ background: "#1C1C1E" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "#E84C3D" }}>Available store credit</p>
          <p className="text-[44px] font-extrabold tabular-nums leading-none mt-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "white" }}>{fp(balance)}</p>
          <p className="text-[13px] mt-2" style={{ color: "var(--subdued)" }}>Earned locally. Spent on food.</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--subdued)", opacity: 0.7 }}>Meal credit, not cash. Use it on ChopDrop meals.</p>
        </div>
      </div>

      {/* ── Info cards ── */}
      <div className="px-5 mt-4 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5 p-3.5 rounded-[14px]" style={{ background: "var(--emerald-soft)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="m5 12 4 4L19 6" /></svg>
          <p className="text-[11px] leading-[155%]" style={{ color: "var(--emerald)" }}>
            Your credit is automatically applied at checkout. Tap Remove there if you&apos;d rather save it for another meal.
          </p>
        </div>
        <div className="flex items-start gap-2.5 p-3.5 rounded-[14px]" style={{ background: "var(--emerald-soft)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" /></svg>
          <div>
            <p className="text-[12px] font-bold" style={{ color: "#1C1C1E" }}>Points ≠ credit</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Points live in Fun rewards. Only converted rewards appear here as spendable naira credit.</p>
          </div>
        </div>
      </div>

      {/* ── Credit history ── */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Credit history</h2>
          <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>All activity</span>
        </div>

        <div className="rounded-[22px] overflow-hidden" style={{ background: "var(--card)" }}>
          {HISTORY.map((item, i) => (
            <div key={i}>
              {i > 0 && <div className="mx-4 h-px" style={{ background: "var(--border)" }} />}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald-soft)" }}>
                  <HistoryIcon type={item.iconType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: "#1C1C1E" }}>{item.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.date}</p>
                </div>
                <span className="text-[14px] font-extrabold tabular-nums shrink-0" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: item.positive ? "var(--emerald)" : "#1C1C1E" }}>
                  {item.positive ? "+" : ""}{fp(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="px-5 mt-6">
        <div className="p-4 rounded-[22px] flex flex-col gap-2" style={{ background: "var(--card)" }}>
          <div className="flex justify-between text-[13px]" style={{ color: "var(--text-muted)" }}>
            <span>Opening balance · 30 Oct</span>
            <span className="font-bold" style={{ color: "#1C1C1E" }}>{fp(0)}</span>
          </div>
          <div className="flex justify-between text-[13px]" style={{ color: "var(--text-muted)" }}>
            <span>Credit earned</span>
            <span className="font-bold" style={{ color: "#1C1C1E" }}>{fp(earned)}</span>
          </div>
          <div className="flex justify-between text-[13px]" style={{ color: "var(--text-muted)" }}>
            <span>Credit spent</span>
            <span className="font-bold" style={{ color: "#1C1C1E" }}>−{fp(spent)}</span>
          </div>
          <div className="h-px mt-1 mb-1" style={{ background: "var(--border)" }} />
          <div className="flex justify-between text-[15px] font-extrabold" style={{ color: "#1C1C1E" }}>
            <span>Available balance</span>
            <span className="tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fp(balance)}</span>
          </div>
        </div>
        <p className="text-[10px] mt-3 leading-[155%]" style={{ color: "var(--text-muted)" }}>
          Food price discounts count toward savings in Me. Only credit posted in this history can be used to pay at checkout.
        </p>
      </div>

      {/* ── CTA ── */}
      <div className="px-5 mt-6 mb-4">
        <Link href="/rewards" className="w-full h-[50px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold press-feedback" style={{ background: "var(--card)", color: "#1C1C1E", border: "1px solid var(--border)" }}>
          <span>Explore Fun rewards</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8V2M2 12h20M7 2h10" /></svg>
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
