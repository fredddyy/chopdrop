"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { SkeletonDealCard } from "@/components/skeleton";

function formatPrice(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString();
}

interface DealSummary {
  id: string; name: string; description: string | null; imageUrl: string | null;
  category: string; brandName: string | null; brandLogoUrl: string | null;
  marketPrice: number; poolPrice: number; minBuyers: number; currentBuyers: number;
  deadline: string; status: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetch("/api/deals").then(r => r.json()).then(d => {
      if (d.success) setDeals(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6 pb-4">
          <div className="w-10 h-10 rounded-full animate-pulse mb-5" style={{ background: "var(--sand)" }} />
          <div className="rounded-[8px] animate-pulse mb-2" style={{ width: "50%", height: 28, background: "var(--sand)" }} />
          <div className="rounded-[8px] animate-pulse" style={{ width: "70%", height: 14, background: "var(--sand)" }} />
        </div>
        <div className="px-5 space-y-4">
          <SkeletonDealCard />
          <SkeletonDealCard />
        </div>
        <BottomNav />
      </main>
    );
  }

  const categories = ["All", ...new Set(deals.map(d => d.category))];
  const filtered = deals.filter(d => activeCategory === "All" || d.category === activeCategory);

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── WARM HEADER — matches the rest of ChopDrop ── */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between mb-5">
          <Link href="/menu" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--emerald)" }} />
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "var(--emerald)" }}>
              {filtered.length} active
            </span>
          </div>
        </div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Group Drops</h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>Limited runs. The more join, the better the rate.</p>
      </div>

      {/* ── CATEGORY PILLS — warm style ── */}
      {deals.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-4">
          {categories.map(cat => (
            <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
              className="h-8 px-4 rounded-full text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
              style={{
                background: activeCategory === cat ? "var(--dark)" : "var(--sand)",
                color: activeCategory === cat ? "white" : "var(--text-secondary)",
              }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── TRANSITION — warm cream fades into dark drop zone ── */}
      <div className="mx-5 rounded-t-[24px] overflow-hidden" style={{ background: "var(--dark)" }}>
        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          <span className="text-[12px] font-bold text-white/50 tracking-wide uppercase">Drop zone</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="text-[48px] font-extrabold" style={{ color: "rgba(255,255,255,0.06)" }}>0</div>
            <p className="text-[16px] font-semibold text-white mt-2">No drops right now</p>
            <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>New drops land weekly. Check back soon.</p>
          </div>
        ) : (
          <div className="px-4 pb-5 space-y-4">
            {filtered.map((deal, idx) => {
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
                  className="block rounded-[16px] overflow-hidden active:scale-[0.98] transition-transform"
                  style={{ background: isFirst ? "var(--card)" : "rgba(255,255,255,0.05)", border: isFirst ? "none" : "1px solid rgba(255,255,255,0.06)" }}>

                  {/* Product image */}
                  {deal.imageUrl && (
                    <div className="relative overflow-hidden" style={{ height: isFirst ? 200 : 160, background: "var(--sand)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={deal.imageUrl} alt={deal.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
                          background: daysLeft <= 1 ? "var(--coral)" : "rgba(0,0,0,0.5)",
                          color: "white",
                        }}>
                          {daysLeft > 1 ? `${daysLeft}d left` : daysLeft === 1 ? "Last day" : hoursLeft > 0 ? `${hoursLeft}h left` : "Ending now"}
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

                  <div className="p-4">
                    <h3 className={`${isFirst ? "text-[18px]" : "text-[16px]"} font-extrabold leading-tight`} style={{ color: isFirst ? "var(--text)" : "white" }}>
                      {deal.name}
                    </h3>

                    {/* Brand credential */}
                    {deal.brandName && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {deal.brandLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={deal.brandLogoUrl} alt={deal.brandName} className="w-4 h-4 rounded-full object-cover" style={{ border: isFirst ? "1px solid var(--border)" : "1px solid rgba(255,255,255,0.1)" }} />
                        ) : (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: isFirst ? "var(--sand)" : "rgba(255,255,255,0.1)", color: isFirst ? "var(--text-muted)" : "rgba(255,255,255,0.5)" }}>
                            {deal.brandName.charAt(0)}
                          </div>
                        )}
                        <span className="text-[10px] font-semibold" style={{ color: isFirst ? "var(--text-muted)" : "rgba(255,255,255,0.35)" }}>
                          by {deal.brandName}
                        </span>
                      </div>
                    )}

                    {deal.description && (
                      <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: isFirst ? "var(--text-muted)" : "rgba(255,255,255,0.35)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {deal.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2.5 mt-3">
                      <span className={`${isFirst ? "text-[22px]" : "text-[20px]"} font-extrabold tabular-nums`} style={{ color: isFirst ? "var(--text)" : "white" }}>
                        {formatPrice(deal.poolPrice)}
                      </span>
                      <span className="text-[12px]" style={{ color: isFirst ? "var(--text-muted)" : "rgba(255,255,255,0.25)" }}>
                        Market {formatPrice(deal.marketPrice)}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="h-[4px] rounded-full overflow-hidden" style={{ background: isFirst ? "var(--sand)" : "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${Math.max(3, progress)}%`,
                          background: isHot ? "var(--emerald)" : "var(--coral)",
                        }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] font-semibold" style={{ color: isFirst ? "var(--text-secondary)" : "rgba(255,255,255,0.35)" }}>
                          {deal.currentBuyers < 5 ? "Just dropped" : `${deal.currentBuyers} of ${deal.minBuyers} joined`}
                        </span>
                        {remaining <= 10 && remaining > 0 && (
                          <span className="text-[10px] font-bold" style={{ color: "var(--coral)" }}>
                            {remaining} spots left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: isFirst ? "1px solid var(--border)" : "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="text-[13px] font-bold" style={{ color: "var(--coral)" }}>Join this drop</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
