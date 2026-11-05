"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

const AVATAR_COLORS = ["#17271F", "#EF502B", "#246347", "#F8CB57", "#E6DEF6"];

interface ProductData {
  id: string; name: string; imageUrl: string | null; retailPrice: number; groupPrice: number;
  vendor: { name: string; address: string };
}

export default function RequestSentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [userArea, setUserArea] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) { const p = JSON.parse(stored); if (p.areaName) setUserArea(p.areaName); }
    } catch {}

    fetch(`/api/products/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.success) setProduct(d.data); })
      .catch(() => {});
  }, [id]);

  if (!product) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 flex items-center justify-center min-h-svh" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 rounded-full" style={{ border: "3px solid var(--border)", borderTopColor: "var(--coral)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Campus Cravings</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>The kitchens heard you</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Success icon + message ── */}
      <div className="flex flex-col items-center px-5 mt-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--emerald-soft)" }}>
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="var(--emerald)" strokeWidth="1.4" strokeLinecap="round"><path d="M5 11.667c0 2.163.702 4.269 2 6 .265.353.66.587 1.098.65.437.062.882-.052 1.235-.317.354-.265.588-.66.65-1.098.063-.437-.051-.882-.316-1.235A6.644 6.644 0 018.333 11.667M5 11.667h1.667m1.666 0h.834c2.534-.066 5.012.76 7 2.333.124.093.271.15.425.163.154.014.31-.015.448-.084.138-.07.255-.176.336-.308.081-.131.125-.283.125-.438V3.333c0-.155-.044-.306-.125-.438a.832.832 0 00-.336-.308.834.834 0 00-.448-.084.834.834 0 00-.425.164c-1.989 1.573-4.466 2.398-7 2.333H6.667 4.167c-.442 0-.866.176-1.179.488A1.667 1.667 0 002.5 6.667V10c0 .442.176.866.488 1.179.313.312.737.488 1.179.488H5m3.333 0H6.667m0-6.667v6.667" /></svg>
        </div>
        <h1 className="text-[28px] font-extrabold text-center" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "#17271F" }}>Craving noted.</h1>
        <p className="text-[14px] text-center mt-2 leading-[145%]" style={{ color: "var(--text-muted)" }}>
          Your {product.name.toLowerCase()} request has joined the demand around {userArea || "your area"}.
        </p>
        <span className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.15em] px-3 py-1 rounded-full" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
          Request sent · No charge
        </span>
      </div>

      {/* ── Demand card (lime) ── */}
      <div className="px-5 mt-6">
        <div className="p-5 rounded-[22px]" style={{ background: "var(--lime)" }}>
          <p className="text-[36px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px", color: "#17271F" }}>39</p>
          <p className="text-[17px] font-extrabold mt-1 leading-[130%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>
            students want {product.name.toLowerCase()} under {fp(product.retailPrice)}
          </p>
          <p className="text-[12px] mt-2" style={{ color: "#17271F", opacity: 0.6 }}>{userArea || "Your area"}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: AVATAR_COLORS[j], border: "2px solid var(--lime)" }}>
                  {String.fromCharCode(65 + j)}
                </div>
              ))}
            </div>
            <span className="text-[11px] font-semibold" style={{ color: "#17271F", opacity: 0.7 }}>You, + 38 students</span>
          </div>
        </div>
      </div>

      {/* ── What happens next ── */}
      <div className="px-5 mt-6">
        <h3 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Here&apos;s what happens next</h3>
        <div className="mt-4 space-y-4">
          {[
            { icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--coral)" strokeWidth="1.4" strokeLinecap="round"><path d="M5 11.667c0 2.163.702 4.269 2 6 .265.353.66.587 1.098.65.437.062.882-.052 1.235-.317.354-.265.588-.66.65-1.098.063-.437-.051-.882-.316-1.235A6.644 6.644 0 018.333 11.667M5 11.667h1.667m1.666 0h.834c2.534-.066 5.012.76 7 2.333.124.093.271.15.425.163.154.014.31-.015.448-.084.138-.07.255-.176.336-.308.081-.131.125-.283.125-.438V3.333c0-.155-.044-.306-.125-.438a.832.832 0 00-.336-.308.834.834 0 00-.448-.084.834.834 0 00-.425.164c-1.989 1.573-4.466 2.398-7 2.333H6.667 4.167c-.442 0-.866.176-1.179.488A1.667 1.667 0 002.5 6.667V10c0 .442.176.866.488 1.179.313.312.737.488 1.179.488H5m3.333 0H6.667m0-6.667v6.667" /></svg>, title: "Your voices add up", desc: "We group requests for the same food and zone." },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>, title: "Vendors see the demand", desc: `When the request threshold is reached, nearby vendors get notified.` },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>, title: "You hear if a pool opens", desc: "We alert interested students. You choose whether to join and pay." },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--coral-soft)" }}>
                {step.icon}
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "#17271F" }}>{step.title}</p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust note ── */}
      <div className="px-5 mt-5">
        <div className="flex items-start gap-2.5 p-4 rounded-[16px]" style={{ background: "var(--coral-soft)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <p className="text-[12px] leading-[155%]" style={{ color: "var(--coral)" }}>
            This is demand, not an order or a promised pool. You haven&apos;t paid and no food is reserved.
          </p>
        </div>
      </div>

      {/* ── Hungry in the meantime ── */}
      <div className="px-5 mt-6">
        <h3 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Hungry in the meantime?</h3>
        <p className="text-[13px] mt-1 leading-[155%]" style={{ color: "var(--text-muted)" }}>
          Browse other meals while kitchens consider the request.
        </p>
        <Link href="/discover" className="mt-2 text-[13px] font-bold inline-block" style={{ color: "var(--coral)" }}>
          See nearby alternatives →
        </Link>
      </div>

      {/* ── CTAs ── */}
      <div className="px-5 mt-6 space-y-2.5 mb-4">
        <button type="button" className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white cursor-pointer press-feedback" style={{ background: "var(--coral)" }}>
          <span>Invite friends to request</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </button>
        <Link href="/discover" className="w-full h-[50px] rounded-full flex items-center justify-between px-6 text-[14px] font-bold cursor-pointer press-feedback" style={{ background: "var(--sand)", color: "#17271F" }}>
          <span>Browse nearby food</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
