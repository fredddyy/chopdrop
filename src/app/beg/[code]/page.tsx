"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

interface BegData {
  sharerName: string;
  product: { id: string; name: string; imageUrl: string | null; groupPrice: number; retailPrice: number; vendor: { name: string } };
  poolId: string;
  poolStatus: string;
  memberCount: number;
  minSize: number;
  clicks: number;
  maxClicks: number;
  totalCredit: number;
  maxCredit: number;
  atMax: boolean;
  clickers: { name: string; amount: number }[];
  shareUrl: string;
}

export default function BegDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [data, setData] = useState<BegData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/beg/${code}`);
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [code]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchData]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/b/${code}`;
  const shortUrl = `chopdrop.app/b/${code}`;

  function shareWhatsApp() {
    if (!data) return;
    const text = `I just joined a group deal for ${data.product.name} on ChopDrop. Tap my link and I save even more:\n\n${shareUrl}\n\nYou can join the deal too — ${fp(data.product.groupPrice)} instead of ${fp(data.product.retailPrice)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function shareWhatsAppStatus() {
    if (!data) return;
    const text = `Saving on ${data.product.name} with ChopDrop 🔥 Tap to help me save more: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function payNow() {
    if (!data) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/pools/${data.poolId}/checkout`, { method: "POST" });
      const d = await res.json();
      if (d.success && d.data.authorizationUrl) {
        window.location.href = d.data.authorizationUrl;
        return;
      }
    } catch { /* ignore */ }
    setPaying(false);
  }

  if (loading) {
    return (
      <main className="min-h-svh flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 rounded-full" style={{ border: "3px solid var(--border)", borderTopColor: "var(--coral)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>Link not found</p>
        <button type="button" onClick={() => router.back()} className="text-[14px] font-bold mt-3 cursor-pointer" style={{ color: "var(--coral)" }}>Go back</button>
      </main>
    );
  }

  const currentPrice = data.product.groupPrice - data.totalCredit;
  const floorPrice = Math.round(data.product.groupPrice * 0.4);
  const firstClickValue = data.clicks === 0 ? 100 : null;

  return (
    <main className="min-h-svh" style={{ background: "var(--bg)" }}>
      <div className="max-w-[480px] mx-auto w-full px-5 pb-8">

        {/* ── Header ── */}
        <div className="pt-4 flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Beg Price</p>
            <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Small beg. Big savings.</p>
          </div>
          <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--sand)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
          </button>
        </div>

        {/* ── Product info ── */}
        <div className="mt-5 flex items-start gap-3">
          {data.product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.product.imageUrl} alt={data.product.name} className="w-[70px] h-[70px] rounded-[16px] object-cover shrink-0" />
          )}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full inline-block mb-1.5" style={{ background: "var(--lime)", color: "#17271F" }}>Beg Price</span>
            <h2 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{data.product.name}</h2>
            <p className="text-[12px]" style={{ color: "var(--text-muted)", lineHeight: "145%" }}>{data.product.vendor.name} · <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--text-muted)" stroke="none" className="inline-block -mt-px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> 4.8</p>
          </div>
        </div>

        {/* ── Price card — dark forest ── */}
        <div className="mt-5 p-5 rounded-[22px]" style={{ background: "#17271F" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--coral)" }}>Your price right now</p>
          <p className="text-[44px] font-extrabold tabular-nums leading-none text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px" }}>
            {fp(currentPrice)}
          </p>
          <p className="text-[12px] mt-2" style={{ color: "var(--subdued)" }}>
            {fp(data.product.retailPrice)} individual · {fp(data.product.groupPrice)} pool price
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[12px] font-extrabold text-white">{fp(data.totalCredit)} knocked off</span>
            <span className="text-[12px] font-bold" style={{ color: "var(--lime)" }}>{fp(floorPrice)} floor</span>
          </div>
          {/* Progress bar + dots */}
          <div className="flex items-center gap-1.5 mt-3">
            {Array.from({ length: Math.min(data.maxClicks, 15) }).map((_, i) => (
              <div key={i} className="w-[6px] h-[6px] rounded-full" style={{ background: i < data.clicks ? "var(--lime)" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: "var(--subdued)" }}>
            The price can&apos;t go below the vendor&apos;s {fp(floorPrice)} floor.
          </p>
        </div>

        {/* ── Explanation ── */}
        <div className="mt-6">
          <h3 className="text-[21px] font-extrabold leading-[130%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>
            Your friends click.<br />Your price drops.
          </h3>
          <p className="text-[14px] mt-2 leading-[145%]" style={{ color: "var(--text-muted)" }}>
            Send your personal link. Friends only need to click and engage — they don&apos;t have to buy.
          </p>
        </div>

        {/* ── Share link display ── */}
        <div className="mt-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral-soft)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: "#17271F" }}>{shortUrl}</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Your tracked link · {data.clicks} friend engagement{data.clicks !== 1 ? "s" : ""}</p>
          </div>
          <button type="button" onClick={copyLink} className="w-9 h-9 rounded-[8px] flex items-center justify-center cursor-pointer shrink-0" style={{ background: "var(--sand)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={copied ? "var(--emerald)" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          </button>
        </div>

        {/* ── Share buttons — bordered, not filled ── */}
        <div className="mt-5 space-y-2.5">
          <button type="button" onClick={shareWhatsApp}
            className="w-full h-[50px] rounded-full text-[14px] font-bold flex items-center justify-between px-5 cursor-pointer press-feedback"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "#17271F" }}
          >
            WhatsApp Message
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </button>
          <button type="button" onClick={shareWhatsAppStatus}
            className="w-full h-[50px] rounded-full text-[14px] font-bold flex items-center justify-between px-5 cursor-pointer press-feedback"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "#17271F" }}
          >
            Share to WhatsApp Status
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></svg>
          </button>
        </div>

        {/* ── Info note ── */}
        <div className="mt-5 flex items-start gap-2.5 p-4 rounded-[12px]" style={{ background: "var(--emerald-soft)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="m5 12 4 4L19 6" /></svg>
          <p className="text-[12px] leading-[155%]" style={{ color: "var(--emerald)" }}>
            {firstClickValue ? `First engagement: −₦${firstClickValue}. The next reductions get smaller. ` : ""}You can pay your current price at any time.
          </p>
        </div>

        {/* ── Pool info ── */}
        <p className="text-[11px] text-center mt-4" style={{ color: "var(--text-muted)" }}>
          Pool {data.memberCount}/{data.minSize} · Pickup at {data.product.vendor.name}
        </p>

        {/* ── Pay Now CTA ── */}
        <div className="mt-4">
          <button
            type="button" onClick={payNow} disabled={paying}
            className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white cursor-pointer press-feedback disabled:opacity-50"
            style={{ background: "var(--coral)" }}
          >
            <span>Pay {fp(currentPrice)} Now</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
          </button>
          <p className="text-[11px] text-center mt-2" style={{ color: "var(--text-muted)" }}>
            or keep sharing to reduce your price
          </p>
        </div>

      </div>
    </main>
  );
}
