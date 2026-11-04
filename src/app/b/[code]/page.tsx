"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

export default function BegClickPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [state, setState] = useState<"loading" | "needsAuth" | "clicked" | "alreadyClicked" | "error">("loading");
  const [data, setData] = useState<{ sharerName: string; creditAmount: number; productId: string; poolId: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function trackClick() {
      try {
        const res = await fetch(`/api/beg/${code}`, { method: "POST" });
        const d = await res.json();

        if (!d.success && d.needsAuth) {
          setState("needsAuth");
          // Fetch GET for display info even without auth
          const infoRes = await fetch(`/api/beg/${code}`);
          const info = await infoRes.json();
          if (info.success) setData({ sharerName: info.data.sharerName, creditAmount: 0, productId: info.data.product.id, poolId: info.data.poolId });
          return;
        }

        if (d.success) {
          setData(d.data);
          setState(d.data.alreadyClicked ? "alreadyClicked" : "clicked");
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            router.push(`/product/${d.data.productId}?pool=${d.data.poolId}`);
          }, 3000);
          return;
        }

        setErrorMsg(d.error || "Something went wrong");
        setState("error");
      } catch {
        setErrorMsg("Network error");
        setState("error");
      }
    }

    trackClick();
  }, [code, router]);

  // Loading
  if (state === "loading") {
    return (
      <main className="min-h-svh flex items-center justify-center" style={{ background: "var(--dark)" }}>
        <div className="w-10 h-10 rounded-full" style={{ border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--emerald)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  // Needs auth — acquisition funnel
  if (state === "needsAuth") {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--dark)" }}>
        <div className="max-w-[400px] w-full text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(232,96,76,0.15)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-white tracking-[-0.02em] mb-2">
            Help {data?.sharerName || "your friend"} save
          </h1>
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Sign up to count your click. Takes 10 seconds.
          </p>
          <Link
            href={`/auth?returnTo=/b/${code}`}
            className="w-full h-[52px] rounded-[12px] text-[15px] font-bold text-white flex items-center justify-center press-feedback mb-3"
            style={{ background: "var(--coral)" }}
          >
            Sign up &amp; help
          </Link>
          <Link
            href={`/auth?returnTo=/b/${code}`}
            className="w-full h-[44px] rounded-[12px] text-[14px] font-bold flex items-center justify-center press-feedback"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            Log in
          </Link>
        </div>
      </main>
    );
  }

  // Error
  if (state === "error") {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--dark)" }}>
        <p className="text-[14px] text-white/50 mb-4">{errorMsg}</p>
        <Link href="/discover" className="text-[14px] font-bold" style={{ color: "var(--coral)" }}>Browse deals</Link>
      </main>
    );
  }

  // Clicked or already clicked — the celebration interstitial
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--dark)" }}>
      <div className="max-w-[400px] w-full text-center">
        {/* Checkmark celebration */}
        <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center celebrate" style={{ background: "var(--emerald)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
        </div>

        {state === "alreadyClicked" ? (
          <>
            <p className="text-[16px] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>You already helped</p>
            <h1 className="text-[28px] font-extrabold text-white tracking-[-0.02em]">
              <span style={{ color: "var(--coral)" }}>{data?.sharerName}</span>
            </h1>
          </>
        ) : (
          <>
            <p className="text-[16px] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>You just saved</p>
            <h1 className="text-[28px] font-extrabold text-white tracking-[-0.02em] mb-1">
              <span style={{ color: "var(--coral)" }}>{data?.sharerName}</span>{" "}
              <span className="savings-reveal" style={{ color: "var(--emerald)" }}>{data ? fp(data.creditAmount) : ""}</span>
            </h1>
          </>
        )}

        <p className="text-[13px] mt-4 mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
          Redirecting to the deal...
        </p>

        <Link
          href={data ? `/product/${data.productId}?pool=${data.poolId}` : "/discover"}
          className="w-full h-[50px] rounded-[12px] text-[14px] font-bold text-white flex items-center justify-center press-feedback"
          style={{ background: "var(--emerald)" }}
        >
          {state === "alreadyClicked" ? "View this deal" : "Join this deal too"}
        </Link>

        <Link href="/discover" className="block mt-4 text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
          or browse more deals
        </Link>
      </div>
    </main>
  );
}
