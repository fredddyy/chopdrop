"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function formatPrice(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString();
}

interface DealSummary {
  id: string; name: string; description: string | null; imageUrl: string | null;
  marketPrice: number; poolPrice: number; minBuyers: number; currentBuyers: number;
  deadline: string; status: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deals").then(r => r.json()).then(d => {
      if (d.success) setDeals(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-svh flex items-center justify-center" style={{ background: "#141413" }}>
        <div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "#141413" }}>

      {/* ── DARK HERO HEADER — drop culture ── */}
      <div className="relative overflow-hidden">
        <div className="px-6 pt-8 pb-6 relative z-10">
          <Link href="/menu" className="w-10 h-10 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(255,255,255,0.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--emerald)" }} />
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: "var(--emerald)" }}>
              {deals.length} active {deals.length === 1 ? "drop" : "drops"}
            </span>
          </div>

          <h1 className="text-[32px] font-extrabold text-white tracking-[-0.03em] leading-[1.1]">
            Group<br />Drops
          </h1>
          <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Limited runs. The more people join,<br />the better the rate. When it&apos;s gone, it&apos;s gone.
          </p>
        </div>

        {/* Decorative glow */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(196,87,42,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(26,125,75,0.1) 0%, transparent 70%)" }} />
      </div>

      {deals.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <div className="text-[48px] font-extrabold" style={{ color: "rgba(255,255,255,0.08)" }}>0</div>
          <p className="text-[16px] font-semibold text-white mt-2">No drops right now</p>
          <p className="text-[14px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>New drops land weekly. Check back soon.</p>
        </div>
      ) : (
        <div className="px-5 pt-2 space-y-5">
          {deals.map((deal, idx) => {
            const progress = Math.min(100, (deal.currentBuyers / deal.minBuyers) * 100);
            const remaining = Math.max(0, deal.minBuyers - deal.currentBuyers);
            const deadlineDate = new Date(deal.deadline);
            const now = new Date();
            const daysLeft = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 86400000));
            const hoursLeft = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 3600000));
            const isHot = progress > 60;
            const isFirst = idx === 0;

            return (
              <Link key={deal.id} href={`/deals/${deal.id}`}
                className="block rounded-[20px] overflow-hidden active:scale-[0.98] transition-transform"
                style={{ background: isFirst ? "var(--card)" : "rgba(255,255,255,0.04)", border: isFirst ? "none" : "1px solid rgba(255,255,255,0.06)" }}>

                {/* Product image */}
                {deal.imageUrl && (
                  <div className="relative overflow-hidden" style={{ height: isFirst ? 220 : 180, background: "var(--sand)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={deal.imageUrl} alt={deal.name} className="w-full h-full object-cover" loading="lazy" />

                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm" style={{
                        background: daysLeft <= 1 ? "rgba(196,87,42,0.85)" : "rgba(0,0,0,0.5)",
                        color: "white",
                      }}>
                        {daysLeft > 1 ? `${daysLeft} days left` : daysLeft === 1 ? "Last day" : hoursLeft > 0 ? `${hoursLeft}h left` : "Ending now"}
                      </span>
                    </div>

                    {isHot && (
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--coral)", color: "white" }}>
                          Filling fast
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5">
                  <h3 className={`${isFirst ? "text-[20px]" : "text-[17px]"} font-extrabold leading-tight`} style={{ color: isFirst ? "var(--text)" : "white" }}>
                    {deal.name}
                  </h3>
                  {deal.description && (
                    <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: isFirst ? "var(--text-muted)" : "rgba(255,255,255,0.4)" }}>
                      {deal.description}
                    </p>
                  )}

                  {/* Price — hero element */}
                  <div className="flex items-baseline gap-3 mt-4">
                    <span className={`${isFirst ? "text-[28px]" : "text-[24px]"} font-extrabold tabular-nums`} style={{ color: isFirst ? "var(--text)" : "white" }}>
                      {formatPrice(deal.poolPrice)}
                    </span>
                    <span className="text-[13px]" style={{ color: isFirst ? "var(--text-muted)" : "rgba(255,255,255,0.3)" }}>
                      Market {formatPrice(deal.marketPrice)}
                    </span>
                  </div>

                  {/* Progress — minimal */}
                  <div className="mt-4">
                    <div className="h-[5px] rounded-full overflow-hidden" style={{ background: isFirst ? "var(--sand)" : "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${Math.max(3, progress)}%`,
                        background: isHot ? "var(--emerald)" : "var(--coral)",
                      }} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[12px] font-semibold" style={{ color: isFirst ? "var(--text-secondary)" : "rgba(255,255,255,0.4)" }}>
                        {deal.currentBuyers < 5 ? "Just dropped" : `${deal.currentBuyers} of ${deal.minBuyers} joined`}
                      </span>
                      {remaining <= 10 && remaining > 0 && (
                        <span className="text-[11px] font-bold" style={{ color: "var(--coral)" }}>
                          {remaining} spots left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[13px] font-bold" style={{ color: "var(--coral)" }}>
                      Join this drop
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
