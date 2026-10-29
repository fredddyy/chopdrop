"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function formatPrice(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString();
}

interface DealData {
  id: string; name: string; description: string | null; imageUrl: string | null;
  marketPrice: number; poolPrice: number; minBuyers: number; currentBuyers: number;
  deadline: string; pickupInfo: string | null; status: string;
  collectionPoints: { id: string; name: string; address: string; type: string }[];
  participants: { id: string; firstName: string; quantity: number; collectionPoint: string | null }[];
}

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [deal, setDeal] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [selectedCp, setSelectedCp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/deals/${dealId}`).then(r => r.json()).then(d => {
      if (d.success) setDeal(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dealId]);

  async function handleJoin() {
    setJoining(true); setError("");
    try {
      const res = await fetch("/api/deals/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, collectionPointId: selectedCp || undefined }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed to join"); setJoining(false); return; }
      setJoined(true);
    } catch { setError("Network error"); }
    setJoining(false);
  }

  if (loading) {
    return (
      <main className="min-h-svh flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!deal) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <h1 className="text-[20px] font-extrabold mb-2" style={{ color: "var(--text)" }}>Deal not found</h1>
        <Link href="/deals" className="text-[14px] font-bold" style={{ color: "var(--coral)" }}>Browse all deals</Link>
      </main>
    );
  }

  const savings = deal.marketPrice - deal.poolPrice;
  const savingsPct = Math.round((savings / deal.marketPrice) * 100);
  const progress = Math.min(100, (deal.currentBuyers / deal.minBuyers) * 100);
  const remaining = Math.max(0, deal.minBuyers - deal.currentBuyers);
  const deadlineDate = new Date(deal.deadline);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 3600000));
  const daysLeft = Math.floor(hoursLeft / 24);
  const timeLabel = daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left` : `${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} left`;
  const isFilled = deal.status === "FILLED" || deal.status === "COMPLETED";
  const isExpired = deal.status === "EXPIRED" || deal.status === "CANCELLED" || now > deadlineDate;
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* Hero image — full width, dark overlay at top for back button */}
      <div className="relative" style={{ height: 260, background: "var(--sand)" }}>
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.imageUrl} alt={deal.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1"><path d="M6 7h12l1 14H5L6 7Z" /></svg>
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 h-20" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)" }} />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Link href="/deals" className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${deal.name} — ${formatPrice(deal.poolPrice)} instead of ${formatPrice(deal.marketPrice)} (${savingsPct}% off)! ${remaining} more people needed. Join here: ${appUrl}/deals/${deal.id}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
          </a>
        </div>

        {/* Savings badge */}
        <div className="absolute bottom-4 left-4">
          <span className="text-[13px] font-extrabold px-3 py-1.5 rounded-full text-white" style={{ background: "var(--emerald)" }}>
            Save {savingsPct}%
          </span>
        </div>
      </div>

      <div className="px-5 -mt-3">
        {/* Price card — overlaps the image */}
        <div className="rounded-[20px] p-5 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] leading-tight" style={{ color: "var(--text)" }}>{deal.name}</h1>

          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-[28px] font-extrabold tabular-nums" style={{ color: "var(--emerald)" }}>{formatPrice(deal.poolPrice)}</span>
            <span className="text-[16px] line-through" style={{ color: "var(--text-muted)" }}>{formatPrice(deal.marketPrice)}</span>
            <span className="text-[13px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(13,159,95,0.1)", color: "var(--emerald)" }}>
              -{formatPrice(savings)}
            </span>
          </div>

          {deal.description && (
            <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{deal.description}</p>
          )}
        </div>

        {/* Progress tracker */}
        <div className="rounded-[20px] p-5 mt-4" style={{ background: "var(--dark)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-bold text-white">{deal.currentBuyers} of {deal.minBuyers} joined</span>
            <span className="text-[13px] font-bold" style={{ color: isFilled ? "var(--emerald)" : "var(--gold)" }}>
              {isFilled ? "Pool filled!" : isExpired ? "Expired" : timeLabel}
            </span>
          </div>
          <div className="h-[8px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${Math.max(3, progress)}%`,
              background: isFilled ? "var(--emerald)" : progress > 70 ? "var(--emerald)" : progress > 40 ? "var(--gold)" : "var(--coral)",
            }} />
          </div>
          {remaining > 0 && !isFilled && !isExpired && (
            <p className="text-[13px] mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              {remaining} more {remaining === 1 ? "person" : "people"} to activate this deal
            </p>
          )}
        </div>

        {/* How it works */}
        <div className="mt-4 rounded-[20px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-[16px] font-extrabold mb-3" style={{ color: "var(--text)" }}>How it works</h3>
          <div className="space-y-3">
            {[
              { n: "1", text: `Join the deal and pay ${formatPrice(deal.poolPrice)}` },
              { n: "2", text: `If ${deal.minBuyers} people join by ${deadlineDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} → deal activates` },
              { n: "3", text: "If pool doesn't fill → full refund, automatic" },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold text-white" style={{ background: "var(--coral)" }}>{step.n}</div>
                <p className="text-[14px] pt-0.5" style={{ color: "var(--text-secondary)" }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who's joined — social proof */}
        {deal.participants.length > 0 && (
          <div className="mt-4 rounded-[20px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-[16px] font-extrabold mb-3" style={{ color: "var(--text)" }}>Who&apos;s joined</h3>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {deal.participants.slice(0, 6).map((p, i) => (
                  <div key={p.id} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ border: "2px solid var(--card)", background: ["#C4572A", "#D4A24E", "#1A7D4B", "#6B6560", "#C4572A", "#D4A24E"][i % 6], zIndex: 6 - i }}>
                    {p.firstName.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                {deal.participants.length > 6 ? `+${deal.participants.length - 6} others` : `${deal.participants.length} ${deal.participants.length === 1 ? "person" : "people"}`}
              </span>
            </div>
          </div>
        )}

        {/* Collection points */}
        {deal.collectionPoints.length > 0 && !joined && (
          <div className="mt-4 rounded-[20px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-[16px] font-extrabold mb-3" style={{ color: "var(--text)" }}>Where to collect</h3>
            <div className="space-y-2">
              {deal.collectionPoints.map(cp => (
                <button key={cp.id} type="button" onClick={() => setSelectedCp(cp.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-[14px] text-left cursor-pointer transition-all"
                  style={{ background: selectedCp === cp.id ? "rgba(13,159,95,0.06)" : "var(--sand)", border: selectedCp === cp.id ? "2px solid var(--emerald)" : "2px solid transparent" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: cp.type === "OFFICE" ? "var(--coral)" : cp.type === "DELIVERY" ? "var(--gold)" : "var(--dark)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      {cp.type === "OFFICE" ? <path d="M4 21V4h11v17M15 9h5v12" /> : cp.type === "DELIVERY" ? <path d="M6 7h12l1 14H5L6 7Z" /> : <><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z" /></>}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{cp.name}</span>
                    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{cp.address}</p>
                  </div>
                  {selectedCp === cp.id && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pickup info */}
        {deal.pickupInfo && (
          <div className="mt-4 p-4 rounded-[14px] flex items-center gap-3" style={{ background: "var(--sand)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{deal.pickupInfo}</span>
          </div>
        )}

        {error && <div className="mt-4 p-3 rounded-[14px] text-[14px] font-medium" style={{ background: "#FEF2F2", color: "var(--coral)" }}>{error}</div>}

        {/* Join / Joined state */}
        {joined ? (
          <div className="mt-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--emerald)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <h2 className="text-[20px] font-extrabold mb-1" style={{ color: "var(--text)" }}>You&apos;re in!</h2>
            <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>We&apos;ll notify you when the deal activates.</p>
            <a href={`https://wa.me/?text=${encodeURIComponent(`I just joined the ${deal.name} deal on ChopDrop — ${formatPrice(deal.poolPrice)} instead of ${formatPrice(deal.marketPrice)}! ${remaining} more people needed: ${appUrl}/deals/${deal.id}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 w-full h-12 rounded-full text-[15px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-transform cursor-pointer"
              style={{ background: "#25d366" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Share to fill the pool
            </a>
          </div>
        ) : !isExpired && (
          <div className="mt-6 space-y-3">
            <button type="button" onClick={handleJoin} disabled={joining}
              className="w-full h-14 rounded-full text-[16px] font-bold text-white flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-all disabled:opacity-50"
              style={{ background: "var(--coral)" }}>
              {joining ? "Joining..." : `Join for ${formatPrice(deal.poolPrice)}`}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${deal.name} — ${formatPrice(deal.poolPrice)} instead of ${formatPrice(deal.marketPrice)} (${savingsPct}% off)! ${remaining} more people needed: ${appUrl}/deals/${deal.id}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full h-12 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-transform"
              style={{ background: "#25d366", color: "white" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Share deal — {remaining} more needed
            </a>
          </div>
        )}

        {isExpired && !isFilled && (
          <div className="mt-6 text-center py-6">
            <p className="text-[16px] font-bold" style={{ color: "var(--text-muted)" }}>This deal has expired</p>
            <Link href="/deals" className="text-[14px] font-bold mt-2 block" style={{ color: "var(--coral)" }}>Browse active deals</Link>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
