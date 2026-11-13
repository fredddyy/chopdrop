"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CartItem { name: string; imageUrl: string | null; retailPrice: number; groupPrice: number; quantity: number; }
interface ChopData {
  shareCode: string; status: string; retailTotal: number; groupFloor: number; currentTotal: number;
  chopAmountPerClick: number; currentChopCount: number; maxChops: number; expiresAt: string;
  cartSnapshot: CartItem[]; ownerFirstName: string;
}

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

export default function ChopClickPage() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<ChopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [chopping, setChopping] = useState(false);
  const [result, setResult] = useState<{ chopAmount: number; newTotal: number } | null>(null);
  const [error, setError] = useState("");
  const [chopError, setChopError] = useState("");

  useEffect(() => {
    fetch(`/api/chop/${code}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); else setError(d.error); })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [code]);

  async function handleChop() {
    if (!name.trim()) { setChopError("Enter your name first"); return; }
    setChopping(true);
    setChopError("");
    try {
      const res = await fetch(`/api/chop/${code}/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setChopError(json.error || "Failed to chop");
      }
    } catch { setChopError("Network error"); }
    setChopping(false);
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-svh flex flex-col" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-10">
          <div className="h-[200px] rounded-[16px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-8 rounded-lg w-48 mb-3" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-5 rounded-lg w-64" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-svh flex flex-col items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <p className="text-[15px] font-bold mb-2" style={{ color: "var(--text)" }}>Couldn&apos;t load this chop</p>
        <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
        <Link href="/home" className="h-11 px-6 rounded-[12px] text-[13px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Go to ChopDrop</Link>
      </main>
    );
  }

  const item = data.cartSnapshot[0];
  const isActive = data.status === "ACTIVE" && new Date(data.expiresAt) > new Date();
  const isFull = data.currentChopCount >= data.maxChops;
  const isPaid = data.status === "PAID";
  const saved = data.retailTotal - data.currentTotal;
  const chopPct = data.maxChops > 0 ? Math.round((data.currentChopCount / data.maxChops) * 100) : 0;

  // Success state — friend just chopped
  if (result) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-svh flex flex-col items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "var(--emerald)" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
        </div>
        <h1 className="text-[24px] font-extrabold text-center" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
          You chopped {fp(result.chopAmount)}!
        </h1>
        <p className="text-[15px] mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          {data.ownerFirstName} now pays {fp(result.newTotal)} instead of {fp(data.retailTotal)}
        </p>
        <div className="mt-8 w-full space-y-3">
          <Link href="/home" className="w-full h-[50px] rounded-full flex items-center justify-center text-[15px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>
            Browse ChopDrop deals
          </Link>
          <p className="text-[12px] text-center" style={{ color: "var(--text-muted)" }}>
            Want cheaper food too? Join ChopDrop and start your own chop!
          </p>
        </div>
      </main>
    );
  }

  // Session ended states
  if (isPaid) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-svh flex flex-col items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <p className="text-[18px] font-extrabold mb-2" style={{ color: "var(--text)" }}>This order has been placed</p>
        <p className="text-[13px] mb-6" style={{ color: "var(--text-muted)" }}>{data.ownerFirstName} already paid. Thanks for helping!</p>
        <Link href="/home" className="h-11 px-6 rounded-full text-[14px] font-bold text-white inline-flex items-center press-feedback" style={{ background: "var(--coral)" }}>Browse ChopDrop</Link>
      </main>
    );
  }

  if (!isActive && !isFull) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-svh flex flex-col items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <p className="text-[18px] font-extrabold mb-2" style={{ color: "var(--text)" }}>This chop session has ended</p>
        <p className="text-[13px] mb-6" style={{ color: "var(--text-muted)" }}>The timer ran out.</p>
        <Link href="/home" className="h-11 px-6 rounded-full text-[14px] font-bold text-white inline-flex items-center press-feedback" style={{ background: "var(--coral)" }}>Browse ChopDrop</Link>
      </main>
    );
  }

  // Main chop page
  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full min-h-svh" style={{ background: "var(--bg)" }}>
      {/* Hero product image */}
      {item?.imageUrl && (
        <div className="h-[220px] overflow-hidden" style={{ background: "var(--sand)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-5 pt-5 pb-10">
        {/* Heading */}
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
          Help {data.ownerFirstName} chop the price!
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
          {data.ownerFirstName} is ordering {item?.name}. Tap below to chop {fp(data.chopAmountPerClick)} off their bill.
        </p>

        {/* Price display */}
        <div className="mt-5 flex items-end gap-3">
          <span className="text-[36px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>{fp(data.currentTotal)}</span>
          <span className="text-[18px] font-extrabold tabular-nums leading-none line-through pb-0.5" style={{ color: "var(--text-muted)" }}>{fp(data.retailTotal)}</span>
        </div>
        {saved > 0 && (
          <p className="text-[12px] font-bold mt-1" style={{ color: "var(--emerald)" }}>{fp(saved)} chopped off so far</p>
        )}

        {/* Progress */}
        <div className="mt-4">
          <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "var(--sand)" }}>
            <div className="h-full rounded-full" style={{
              width: `${chopPct}%`,
              background: chopPct >= 80 ? "var(--emerald)" : chopPct >= 40 ? "var(--gold)" : "var(--coral)",
              transition: "width 0.5s ease",
            }} />
          </div>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{data.currentChopCount} of {data.maxChops} chops used</p>
        </div>

        {/* Chop form */}
        {isActive && !isFull && (
          <div className="mt-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              maxLength={30}
              className="w-full h-[48px] px-4 rounded-[12px] text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
              style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            {chopError && <p className="text-[12px] mt-1 font-bold" style={{ color: "var(--coral)" }}>{chopError}</p>}
            <button
              type="button"
              onClick={handleChop}
              disabled={chopping || !name.trim()}
              className="w-full h-[54px] rounded-full flex items-center justify-center text-[16px] font-extrabold text-white press-feedback mt-3 disabled:opacity-50"
              style={{ background: "var(--coral)" }}
            >
              {chopping ? "Chopping..." : `Chop ${fp(data.chopAmountPerClick)} off!`}
            </button>
            <p className="text-[11px] mt-2 text-center" style={{ color: "var(--text-muted)" }}>
              No signup needed. Just enter your name and tap.
            </p>
          </div>
        )}

        {/* Max chops reached */}
        {isFull && (
          <div className="mt-6 rounded-[16px] p-4 text-center" style={{ background: "var(--emerald-soft)" }}>
            <p className="text-[15px] font-bold" style={{ color: "var(--emerald)" }}>All chops used! {data.ownerFirstName} got the best price.</p>
          </div>
        )}

        {/* CTA to join ChopDrop */}
        <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>Want cheaper food too?</p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>Join ChopDrop and get friends to chop YOUR prices down.</p>
          <Link href="/home" className="mt-3 w-full h-[48px] rounded-full flex items-center justify-center text-[14px] font-bold press-feedback" style={{ background: "var(--sand)", color: "var(--text)" }}>
            Browse ChopDrop deals
          </Link>
        </div>
      </div>
    </main>
  );
}
