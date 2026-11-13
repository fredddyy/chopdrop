"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

interface CartItem { productId: string; name: string; imageUrl: string | null; quantity: number; retailPrice: number; groupPrice: number; }
interface Chopper { name: string; amount: number; createdAt: string; }
interface ChopData {
  shareCode: string; status: string; retailTotal: number; groupFloor: number; currentTotal: number;
  chopAmountPerClick: number; currentChopCount: number; maxChops: number; expiresAt: string;
  serviceFee: number; cartSnapshot: CartItem[]; ownerFirstName: string; choppers: Chopper[];
}

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

export default function ChopProgressPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [data, setData] = useState<ChopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch(`/api/chop/${code}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || "Failed to load");
    } catch { setError("Network error"); }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [code]);

  // Poll every 5 seconds
  useEffect(() => {
    if (!data || data.status !== "ACTIVE") return;
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [data?.status]);

  // Live countdown
  useEffect(() => {
    if (!data) return;
    const deadline = new Date(data.expiresAt).getTime();
    const tick = () => setTimeLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [data?.expiresAt]);

  async function handlePay() {
    setPaying(true);
    try {
      const res = await fetch(`/api/chop/${code}/pay`, { method: "POST" });
      const json = await res.json();
      if (json.success && json.data.authorizationUrl) {
        window.location.href = json.data.authorizationUrl;
      } else {
        setError(json.error || "Payment failed");
        setPaying(false);
      }
    } catch { setError("Network error"); setPaying(false); }
  }

  function shareWhatsApp() {
    const item = data?.cartSnapshot[0];
    const url = `${window.location.origin}/chop/${code}/click`;
    const text = `Help me chop the price! I'm ordering ${item?.name || "food"} on ChopDrop.\nTap to chop ${fp(data?.chopAmountPerClick || 10000)} off my bill \u2014 takes 2 seconds, no signup needed!\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/chop/${code}/click`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6">
          <div className="h-6 w-32 rounded-lg mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-[180px] rounded-[16px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-10 rounded-lg w-48 mb-3" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-6 rounded-lg w-64" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
        <BottomNav />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24 flex flex-col items-center justify-center min-h-svh px-5" style={{ background: "var(--bg)" }}>
        <p className="text-[15px] font-bold mb-2" style={{ color: "var(--text)" }}>Couldn&apos;t load this chop session</p>
        <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button type="button" onClick={() => { setError(""); setLoading(true); fetchData(); }} className="h-11 px-6 rounded-[12px] text-[13px] font-bold text-white" style={{ background: "var(--coral)" }}>Try again</button>
        <BottomNav />
      </main>
    );
  }

  const item = data.cartSnapshot[0];
  const chopPct = data.maxChops > 0 ? Math.round((data.currentChopCount / data.maxChops) * 100) : 0;
  const saved = data.retailTotal - data.currentTotal;
  const isActive = data.status === "ACTIVE" && timeLeft > 0;
  const isPaid = data.status === "PAID";
  const isExpired = data.status === "EXPIRED" || (data.status === "ACTIVE" && timeLeft <= 0);

  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-44" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-5 pt-4 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center press-feedback shrink-0" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 className="text-[18px] font-extrabold flex-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Price Chop</h1>
      </div>

      {/* Product card */}
      {item && (
        <div className="px-5 mt-4">
          {item.imageUrl && (
            <div className="rounded-[16px] overflow-hidden h-[180px]" style={{ background: "var(--sand)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-[20px] font-extrabold mt-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{item.name}</h2>
        </div>
      )}

      {/* Price hero */}
      <div className="px-5 mt-4">
        <div className="flex items-end gap-3">
          <span className="text-[44px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>{fp(data.currentTotal)}</span>
          {saved > 0 && (
            <span className="text-[20px] font-extrabold tabular-nums leading-none line-through pb-1" style={{ color: "var(--text-muted)" }}>{fp(data.retailTotal)}</span>
          )}
        </div>
        {saved > 0 && (
          <p className="text-[13px] font-bold mt-1" style={{ color: "var(--emerald)" }}>You&apos;ve saved {fp(saved)} so far</p>
        )}
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Best possible price: {fp(data.groupFloor)}</p>
      </div>

      {/* Progress bar */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-bold" style={{ color: "var(--text)" }}>{data.currentChopCount} of {data.maxChops} chops</span>
          <span className="text-[12px] font-bold" style={{ color: chopPct >= 80 ? "var(--emerald)" : chopPct >= 40 ? "var(--gold)" : "var(--text-muted)" }}>{chopPct}%</span>
        </div>
        <div className="h-[8px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
          <div className="h-full rounded-full" style={{
            width: `${chopPct}%`,
            background: chopPct >= 80 ? "var(--emerald)" : chopPct >= 40 ? "var(--gold)" : "var(--coral)",
            transition: "width 0.5s ease, background 0.5s ease",
          }} />
        </div>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Each friend chops {fp(data.chopAmountPerClick)} off your price</p>
      </div>

      {/* Countdown */}
      {(isActive || isExpired) && (
        <div className="px-5 mt-4">
          <div className="rounded-[16px] p-4 text-center" style={{ background: isExpired ? "var(--sand)" : "var(--dark)" }}>
            {isActive ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--gold)" }}>Time left to chop</p>
                <p className="text-[32px] font-extrabold tabular-nums mt-1 leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "white" }}>
                  {hours > 0 && `${hours}h `}{String(mins).padStart(2, "0")}m {String(secs).padStart(2, "0")}s
                </p>
              </>
            ) : (
              <p className="text-[14px] font-bold" style={{ color: "var(--text-muted)" }}>Chop window ended &mdash; you can still pay your chopped price</p>
            )}
          </div>
        </div>
      )}

      {/* Paid celebration */}
      {isPaid && (
        <div className="px-5 mt-4">
          <div className="rounded-[16px] p-5 text-center" style={{ background: "var(--emerald)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(255,255,255,0.2)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <p className="text-[18px] font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Order placed!</p>
            <p className="text-[13px] mt-1 text-white/70">You paid {fp(data.currentTotal + data.serviceFee)} (saved {fp(saved)})</p>
          </div>
        </div>
      )}

      {/* Share section — only when active */}
      {isActive && (
        <div className="px-5 mt-5">
          <p className="text-[14px] font-extrabold mb-3" style={{ color: "var(--text)" }}>Share to chop the price down</p>
          <div className="flex gap-2">
            <button type="button" onClick={shareWhatsApp}
              className="flex-1 h-[48px] rounded-full flex items-center justify-center gap-2 text-[14px] font-bold text-white press-feedback"
              style={{ background: "#25D366" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              WhatsApp
            </button>
            <button type="button" onClick={copyLink}
              className="flex-1 h-[48px] rounded-full flex items-center justify-center gap-2 text-[14px] font-bold press-feedback"
              style={{ background: "var(--sand)", color: "var(--text)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      {/* Friend chop list */}
      {data.choppers.length > 0 && (
        <div className="px-5 mt-5">
          <p className="text-[13px] font-bold mb-2" style={{ color: "var(--text)" }}>Friends who chopped</p>
          <div className="space-y-2">
            {data.choppers.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: ["var(--coral)", "var(--emerald)", "var(--gold)", "#6366F1", "#EC4899"][i % 5] }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{c.name}</span>
                </div>
                <span className="text-[13px] font-extrabold" style={{ color: "var(--emerald)" }}>-{fp(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no chops yet */}
      {data.choppers.length === 0 && isActive && (
        <div className="px-5 mt-5 text-center">
          <div className="flex justify-center -space-x-2 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ border: "2px dashed var(--border)", color: "var(--text-muted)", background: "transparent" }}>?</div>
            ))}
          </div>
          <p className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>No chops yet. Share to get started!</p>
        </div>
      )}

      {/* Sticky CTA */}
      {!isPaid && (
        <div className="fixed bottom-[56px] left-0 right-0 z-40 px-5 pt-3 pb-4" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-[428px] mx-auto">
            <div className="flex gap-2.5">
              {isActive && (
                <button type="button" onClick={shareWhatsApp}
                  className="flex-1 h-[50px] rounded-full flex flex-col items-center justify-center press-feedback"
                  style={{ background: "#25D366" }}>
                  <span className="text-[11px] font-medium text-white/80">Share</span>
                  <span className="text-[14px] font-extrabold text-white leading-none">WhatsApp</span>
                </button>
              )}
              <button type="button" onClick={handlePay} disabled={paying}
                className={`${isActive ? "flex-[1.4]" : "w-full"} h-[50px] rounded-full flex flex-col items-center justify-center text-white press-feedback disabled:opacity-50`}
                style={{ background: "var(--coral)" }}>
                <span className="text-[11px] font-medium" style={{ opacity: 0.8 }}>{paying ? "Processing..." : "Pay now"}</span>
                <span className="text-[15px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fp(data.currentTotal + data.serviceFee)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="fixed bottom-[56px] left-0 right-0 z-40 px-5 pt-3 pb-4" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-[428px] mx-auto">
            <Link href="/home" className="w-full h-[50px] rounded-full flex items-center justify-center text-[15px] font-bold text-white press-feedback" style={{ background: "var(--emerald)" }}>
              Back to home
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
