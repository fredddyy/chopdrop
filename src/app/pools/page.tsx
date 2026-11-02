import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

const STEPS = [
  {
    icon: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
    title: "Pick anything you want",
    desc: "Find a meal, gadget, or outfit from any store on ChopDrop.",
  },
  {
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    title: "Share with your office",
    desc: "Send the pool link. More people = bigger savings for everyone.",
  },
  {
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    title: "Everyone pays less",
    desc: "When the pool fills, you all get the group price. Didn't fill? Full refund.",
  },
];

const EXAMPLES = [
  { item: "Jollof Rice & Chicken", solo: "₦4,500", pool: "₦3,375", people: 5 },
  { item: "Galaxy Buds3", solo: "₦45,000", pool: "₦29,250", people: 15 },
  { item: "Office Snack Box", solo: "₦3,500", pool: "₦2,275", people: 10 },
];

export default function PoolsPage() {
  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Pools</h1>
      </div>

      {/* Hero — what is pooling */}
      <div className="mx-5 mt-2 p-5 rounded-[16px]" style={{ background: "var(--dark)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="pool-dot" />
          <span className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>How it works</span>
        </div>
        <h2 className="text-[20px] font-extrabold text-white leading-tight">
          Buy together,<br />pay less.
        </h2>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
          Pool orders with people nearby. The more who join, the lower the price — up to 35% off everything.
        </p>
      </div>

      {/* Steps */}
      <div className="px-5 mt-5 flex flex-col gap-4">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-start gap-3.5 card-enter" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round">
                <path d={step.icon} />
              </svg>
            </div>
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{step.title}</h3>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Real savings examples */}
      <div className="px-5 mt-6">
        <h3 className="text-[13px] font-bold mb-3" style={{ color: "var(--text-secondary)" }}>Real savings, real items</h3>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3.5 py-3 rounded-[12px] card-enter"
              style={{ background: "var(--card)", border: "1px solid var(--border)", animationDelay: `${(i + 3) * 80}ms` }}
            >
              <div className="min-w-0">
                <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{ex.item}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] line-through" style={{ color: "var(--text-muted)" }}>{ex.solo}</span>
                  <span className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>{ex.pool} with {ex.people}+</span>
                </div>
              </div>
              <span className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>
                {ex.pool}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 mt-6">
        <Link
          href="/discover"
          className="flex items-center justify-center h-[50px] rounded-[12px] text-[14px] font-bold text-white w-full"
          style={{ background: "var(--coral)" }}
        >
          Start browsing stores
        </Link>
        <p className="text-[11px] text-center mt-2" style={{ color: "var(--text-muted)" }}>
          Tap "Pool & Save" on any product to start your first pool
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
