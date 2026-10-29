"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";

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
      if (d.success && d.data?.length > 0) { setDeals(d.data); setLoading(false); return; }
      // Dummy deals for preview when no real deals exist
      setDeals([
        { id: "demo-1", name: "10kg Royal Stallion Rice", description: "Premium long-grain parboiled rice. Perfect for the whole family.", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop", marketPrice: 1200000, poolPrice: 850000, minBuyers: 30, currentBuyers: 23, deadline: new Date(Date.now() + 3 * 86400000).toISOString(), status: "ACTIVE" },
        { id: "demo-2", name: "5L Kings Vegetable Oil", description: "Pure refined vegetable oil for all your cooking needs.", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop", marketPrice: 800000, poolPrice: 550000, minBuyers: 30, currentBuyers: 12, deadline: new Date(Date.now() + 5 * 86400000).toISOString(), status: "ACTIVE" },
        { id: "demo-3", name: "Carton of Indomie (40 packs)", description: "Indomie instant noodles — the office staple. Chicken flavour.", imageUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop", marketPrice: 650000, poolPrice: 480000, minBuyers: 25, currentBuyers: 19, deadline: new Date(Date.now() + 2 * 86400000).toISOString(), status: "ACTIVE" },
        { id: "demo-4", name: "Christmas Turkey (whole)", description: "Premium frozen turkey for the festive season. 6-8kg average.", imageUrl: "https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&h=300&fit=crop", marketPrice: 2500000, poolPrice: 1800000, minBuyers: 40, currentBuyers: 8, deadline: new Date(Date.now() + 14 * 86400000).toISOString(), status: "ACTIVE" },
        { id: "demo-5", name: "25kg Golden Penny Semovita", description: "Smooth semolina flour for the perfect swallow.", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop", marketPrice: 1500000, poolPrice: 1100000, minBuyers: 30, currentBuyers: 27, deadline: new Date(Date.now() + 1 * 86400000).toISOString(), status: "ACTIVE" },
      ]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <Link href="/menu" className="w-10 h-10 rounded-full bg-white flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <Logo size={24} />
          <div className="w-10" />
        </div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Group Deals</h1>
        <p className="text-[15px] mt-1" style={{ color: "var(--text-secondary)" }}>Buy together, pay wholesale. Pool fills → you save big.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : deals.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--sand)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
          </div>
          <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>No deals yet</h2>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>New deals are added weekly. Check back soon.</p>
        </div>
      ) : (
        <div className="px-5 pt-4 space-y-4">
          {deals.map(deal => {
            const savings = deal.marketPrice - deal.poolPrice;
            const savingsPct = Math.round((savings / deal.marketPrice) * 100);
            const progress = Math.min(100, (deal.currentBuyers / deal.minBuyers) * 100);
            const remaining = Math.max(0, deal.minBuyers - deal.currentBuyers);
            const deadlineDate = new Date(deal.deadline);
            const now = new Date();
            const daysLeft = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 86400000));

            return (
              <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-[20px] overflow-hidden active:scale-[0.98] transition-transform" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {/* Image */}
                {deal.imageUrl && (
                  <div className="relative h-[160px] overflow-hidden" style={{ background: "var(--sand)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={deal.imageUrl} alt={deal.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute top-3 left-3">
                      <span className="text-[12px] font-extrabold px-2.5 py-1 rounded-full text-white" style={{ background: "var(--emerald)" }}>
                        {savingsPct}% off
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "var(--dark)" }}>
                        {daysLeft > 0 ? `${daysLeft}d left` : "Ends today"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-[17px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>{deal.name}</h3>
                  {deal.description && <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>{deal.description}</p>}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>{formatPrice(deal.poolPrice)}</span>
                    <span className="text-[14px] line-through" style={{ color: "var(--text-muted)" }}>{formatPrice(deal.marketPrice)}</span>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${Math.max(3, progress)}%`,
                        background: progress > 70 ? "var(--emerald)" : progress > 40 ? "var(--gold)" : "var(--coral)",
                      }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[12px] font-bold" style={{ color: "var(--text-secondary)" }}>
                        {deal.currentBuyers}/{deal.minBuyers} joined
                      </span>
                      <span className="text-[12px] font-bold" style={{ color: remaining <= 5 ? "var(--coral)" : "var(--text-muted)" }}>
                        {remaining} more needed
                      </span>
                    </div>
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
