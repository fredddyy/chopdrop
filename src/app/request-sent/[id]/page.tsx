"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

const AVATAR_COLORS = ["#C4572A", "#1A7D4B", "#D4A24E", "#1C1C1E", "#6366F1"];

interface ProductData {
  id: string; name: string; imageUrl: string | null; retailPrice: number; groupPrice: number;
  vendor: { name: string; address: string };
}

interface DemandData {
  totalCount: number;
  recentNames: string[];
}

export default function RequestSentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [demand, setDemand] = useState<DemandData | null>(null);
  const [userArea, setUserArea] = useState("");
  const [requesting, setRequesting] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) { const p = JSON.parse(stored); if (p.areaName) setUserArea(p.areaName); }
    } catch {}

    // Fetch product + record demand in parallel
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.ok ? r.json() : null),
      fetch("/api/demand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: id }) }).then(r => r.ok ? r.json() : null),
    ]).then(([productData, demandData]) => {
      if (productData?.success) setProduct(productData.data);
      if (demandData?.success) setDemand(demandData.data);
      setRequesting(false);
    }).catch(() => setRequesting(false));
  }, [id]);

  if (requesting || !product) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24 flex items-center justify-center min-h-svh" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-[2.5px] border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--coral)", borderTopColor: "transparent" }} />
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Recording your request...</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  const count = demand?.totalCount || 1;
  const names = demand?.recentNames || [];

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Request</p>
          <p className="text-[14px] font-extrabold" style={{ color: "var(--text)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Craving noted</p>
        </div>
        <div className="w-11" />
      </div>

      {/* ── Success ── */}
      <div className="flex flex-col items-center px-5 mt-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--emerald-soft)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
        </div>
        <h1 className="text-[26px] font-extrabold text-center" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Request sent!</h1>
        <p className="text-[14px] text-center mt-2 leading-[145%]" style={{ color: "var(--text-muted)" }}>
          Your interest in {product.name.toLowerCase()} has been recorded{userArea ? ` for ${userArea}` : ""}. No charge.
        </p>
      </div>

      {/* ── Real demand card ── */}
      <div className="px-5 mt-6">
        <div className="p-5 rounded-[16px]" style={{ background: "var(--dark)" }}>
          <p className="text-[36px] font-extrabold tabular-nums leading-none text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px" }}>{count}</p>
          <p className="text-[15px] font-extrabold mt-1 text-white leading-[130%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {count === 1 ? "person wants" : "people want"} {product.name.toLowerCase()}
          </p>
          {userArea && <p className="text-[12px] mt-1" style={{ color: "var(--subdued)" }}>{userArea}</p>}
          {names.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex -space-x-1.5">
                {names.slice(0, 3).map((name, j) => (
                  <div key={j} className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: AVATAR_COLORS[j % AVATAR_COLORS.length], border: "2px solid var(--dark)" }}>
                    {name.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-[11px]" style={{ color: "var(--subdued)" }}>
                {count === 1 ? "You" : count <= 3 ? names.join(", ") : `${names[0]} + ${count - 1} others`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── What happens next ── */}
      <div className="px-5 mt-6">
        <h3 className="text-[18px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>What happens next</h3>
        <div className="mt-4 space-y-4">
          {[
            { color: "var(--coral)", title: "Requests add up", desc: "We group requests for the same food in your area." },
            { color: "var(--gold)", title: "Vendors see the demand", desc: "When enough people want it, nearby vendors get notified." },
            { color: "var(--emerald)", title: "You hear if a pool opens", desc: "We\u2019ll alert you. You choose whether to join and pay." },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: step.color }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{step.title}</p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust note ── */}
      <div className="px-5 mt-5">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px]" style={{ background: "var(--sand)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>This is a request, not an order. No payment, no food reserved.</p>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="px-5 mt-6 space-y-2.5 mb-4">
        <button type="button"
          className="w-full h-[50px] rounded-full flex items-center justify-center gap-2 text-[15px] font-bold text-white press-feedback"
          style={{ background: "var(--coral)" }}
          onClick={() => {
            const text = `I just requested ${product.name} on ChopDrop. The more people who request, the sooner a pool opens! ${typeof window !== "undefined" ? window.location.origin : ""}/product/${id}`;
            if (navigator.share) navigator.share({ title: product.name, text }).catch(() => {});
            else navigator.clipboard.writeText(text);
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>
          Share to build demand
        </button>
        <Link href="/discover" className="w-full h-[50px] rounded-full flex items-center justify-center text-[14px] font-bold press-feedback" style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}>
          Browse other deals
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
