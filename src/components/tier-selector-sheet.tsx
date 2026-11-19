"use client";

import { useState } from "react";

interface Tier {
  min: number;
  discount: number;
}

interface PoolInfo {
  memberCount: number;
  poolId: string;
  spotsLeft: number;
}

interface TierSelectorSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (tier: Tier) => void;
  tiers: Tier[];
  retailPrice: number;
  productName: string;
  poolsBySize: Record<number, PoolInfo | null>;
  loading: boolean;
}

function fp(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

export function TierSelectorSheet({ open, onClose, onSelect, tiers, retailPrice, poolsBySize, loading }: TierSelectorSheetProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);
  const bestTier = sortedTiers[sortedTiers.length - 1];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 backdrop-enter" style={{ background: "rgba(0,0,0,0.4)" }} />
      <div className="absolute bottom-0 left-0 right-0 sheet-enter" onClick={(e) => e.stopPropagation()}>
        <div className="max-w-[428px] mx-auto rounded-t-[16px] px-5 pt-5 pb-8" style={{ background: "var(--card)" }}>
          {/* Handle */}
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />

          {/* Header */}
          <h3 className="text-[18px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
            Order with others
          </h3>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Pick a group size. Doesn&apos;t fill? You still pay regular price.
          </p>

          {/* Solo reference */}
          <div className="flex items-center justify-between mt-4 px-3 py-2 rounded-[12px]" style={{ background: "var(--sand)" }}>
            <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Buy alone (no discount)</span>
            <span className="text-[14px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text-muted)" }}>{fp(retailPrice)}</span>
          </div>

          {/* Tier cards */}
          <div className="space-y-2 mt-3">
            {sortedTiers.map((tier) => {
              const tierPrice = Math.round(retailPrice * (1 - tier.discount / 100));
              const savings = retailPrice - tierPrice;
              const pool = poolsBySize[tier.min];
              const isSelected = selected === tier.min;
              const isBest = tier.min === bestTier?.min;

              return (
                <div key={tier.min} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  {/* Number circle with group icon */}
                  <div className="w-[40px] h-[40px] rounded-full flex flex-col items-center justify-center shrink-0" style={{ background: isBest ? "var(--emerald)" : "var(--sand)" }}>
                    <span className="text-[14px] font-extrabold leading-none" style={{ color: isBest ? "white" : "var(--text)" }}>{tier.min}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isBest ? "white" : "var(--text-muted)"} strokeWidth="2.5" strokeLinecap="round" className="-mt-0.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>

                  {/* Avatars */}
                  <div className="flex -space-x-1.5 shrink-0">
                    {Array.from({ length: Math.min(tier.min, 4) }).map((_, j) => {
                      const filled = pool ? j < pool.memberCount : false;
                      return (
                        <div key={j} className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[7px] font-bold"
                          style={{ background: filled ? "var(--coral)" : "transparent", border: filled ? "1.5px solid white" : "1.5px dashed var(--border)", color: filled ? "white" : "var(--text-muted)" }}>
                          {filled ? "!" : "?"}
                        </div>
                      );
                    })}
                  </div>

                  {/* Name + price */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{tier.min} people</span>
                      {isBest && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>
                          Best deal
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-[15px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{fp(tierPrice)}</span>
                      <span className="text-[10px] line-through tabular-nums" style={{ color: "var(--text-muted)" }}>{fp(retailPrice)}</span>
                    </div>
                  </div>

                  {/* Join button with amount */}
                  <button type="button"
                    onClick={() => { setSelected(tier.min); onSelect(tier); }}
                    className="h-[36px] px-3.5 rounded-[12px] flex items-center justify-center text-[12px] font-bold text-white press-feedback shrink-0"
                    style={{ background: "var(--emerald)" }}>
                    Join {fp(tierPrice)}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cancel */}
          <button type="button" onClick={onClose} className="w-full h-[40px] flex items-center justify-center text-[13px] font-bold press-feedback mt-3" style={{ color: "var(--text-muted)" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
