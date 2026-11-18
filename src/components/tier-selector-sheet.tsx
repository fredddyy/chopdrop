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
            Pick your group size
          </h3>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            More people = bigger discount
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
                <button
                  key={tier.min}
                  type="button"
                  onClick={() => setSelected(tier.min)}
                  className="w-full rounded-[12px] p-3.5 text-left press-feedback"
                  style={{
                    background: isSelected ? "rgba(232,76,61,0.06)" : "var(--card)",
                    border: isSelected ? "2px solid var(--coral)" : "1.5px solid var(--border)",
                    transition: "all 150ms ease-out",
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Left — size + discount */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center" style={{ background: isSelected ? "var(--coral)" : "var(--sand)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "white" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{tier.min} people</span>
                          {isBest && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>
                              Best value
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: "var(--emerald)" }}>
                          {tier.discount}% off · Save {fp(savings)}
                        </span>
                      </div>
                    </div>

                    {/* Right — price + pool status */}
                    <div className="text-right">
                      <span className="text-[18px] font-extrabold tabular-nums leading-none block" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: isSelected ? "var(--coral)" : "var(--text)" }}>
                        {fp(tierPrice)}
                      </span>
                      {pool && pool.memberCount > 0 ? (
                        <span className="text-[10px] font-bold mt-0.5 block" style={{ color: "var(--emerald)" }}>
                          {pool.memberCount}/{tier.min} joined
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium mt-0.5 block" style={{ color: "var(--text-muted)" }}>
                          Start new
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <button
            type="button"
            disabled={!selected || loading}
            onClick={() => {
              const tier = sortedTiers.find(t => t.min === selected);
              if (tier) onSelect(tier);
            }}
            className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold text-white press-feedback mt-5 disabled:opacity-40"
            style={{ background: "var(--coral)" }}
          >
            {loading ? "Finding group..." : selected ? `Join · ${fp(Math.round(retailPrice * (1 - (sortedTiers.find(t => t.min === selected)?.discount || 0) / 100)))} · ${selected} people` : "Select a group size"}
          </button>

          <button type="button" onClick={onClose} className="w-full h-[40px] flex items-center justify-center text-[13px] font-bold press-feedback mt-2" style={{ color: "var(--text-muted)" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
