"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

export default function AccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [poolCount, setPoolCount] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [streak, setStreak] = useState(4);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chopdrop-customer");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.name) setName(p.name);
        if (p.phone) setPhone(p.phone);
        if (p.areaName) setArea(p.areaName);
      }
    } catch {}

    // Fetch pool stats
    fetch("/api/pools?mine=true")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.success && d.data) {
          setPoolCount(d.data.length);
          const saved = d.data.reduce((sum: number, p: { product: { retailPrice: number; groupPrice: number }; myQuantity: number }) =>
            sum + ((p.product.retailPrice - p.product.groupPrice) * p.myQuantity), 0);
          setTotalSaved(saved);
        }
      })
      .catch(() => {});

    // Fetch wallet
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.success && d.data) {
          if (d.data.firstName) setName(d.data.firstName);
          if (d.data.walletBalance) setWalletBalance(d.data.walletBalance);
        }
      })
      .catch(() => {});
  }, []);

  function logout() {
    document.cookie = "chopdrop-user-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("chopdrop-customer");
    router.push("/auth");
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Me</p>
          <h1 className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Your little wins add up</h1>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Profile — avatar left, details right ── */}
      <div className="px-5 mt-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-[22px] font-extrabold text-white shrink-0" style={{ background: "var(--coral)" }}>
          {name ? name.charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{name || "Set up your profile"}</h2>
          {phone && <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{phone}</p>}
          {area && (
            <span className="mt-1 text-[11px] font-bold px-3 py-1 rounded-full inline-block" style={{ background: "#17271F", color: "white" }}>
              {area}
            </span>
          )}
        </div>
      </div>

      {/* ── Savings card (dark forest) ── */}
      <div className="px-5 mt-5">
        <div className="p-5 rounded-[22px]" style={{ background: "#17271F" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--lime)" }}>This semester · Your earned value</p>
          <p className="text-[36px] font-extrabold tabular-nums leading-none mt-2 text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-2px" }}>{fp(totalSaved)} saved</p>
          <p className="text-[14px] font-bold mt-2 text-white">Same appetite. Smarter spending.</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--subdued)" }}>Food discounts compared with individual prices. Your wallet credit is separate.</p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="px-5 mt-4 flex gap-3">
        <div className="flex-1 p-4 rounded-[22px]" style={{ background: "var(--card)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" className="mb-2"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /></svg>
          <p className="text-[28px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-1px", color: "#17271F" }}>{poolCount}</p>
          <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--text-muted)" }}>pools joined</p>
        </div>
        <div className="flex-1 p-4 rounded-[22px]" style={{ background: "var(--lime)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#17271F" strokeWidth="2" strokeLinecap="round" className="mb-2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          <p className="text-[28px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-1px", color: "#17271F" }}>{streak} days</p>
          <p className="text-[11px] font-semibold mt-1" style={{ color: "#17271F", opacity: 0.6 }}>current streak</p>
        </div>
      </div>

      {/* ── Wallet ── */}
      <div className="px-5 mt-4">
        <Link href="/rewards" className="flex items-center gap-3 p-4 rounded-[22px] press-feedback" style={{ background: "var(--card)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /></svg>
          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-extrabold tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>{fp(walletBalance)}</p>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Wallet · Store credit for your next chop</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
        </Link>
        <button className="mt-2 text-[13px] font-bold cursor-pointer" style={{ color: "var(--coral)" }}>
          See how you earned it →
        </button>
      </div>

      {/* ── Quick Links ── */}
      <div className="px-5 mt-6">
        <h3 className="text-[17px] font-extrabold mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Quick Links</h3>
        <div className="rounded-[22px] overflow-hidden" style={{ background: "var(--card)" }}>
          {[
            { label: "My orders", sub: "Track a plate or revisit a receipt", href: "/pools" },
            { label: "Edit profile", sub: "Your name, phone and delivery area", href: "#" },
            { label: "Bring your people", sub: "Referrals · Share your link", href: "#" },
            { label: "Fun rewards", sub: "Daily scratch, streak and points", href: "/rewards" },
            { label: "Settings", sub: "Notifications, payments and help", href: "#" },
          ].map((item, i) => (
            <div key={item.label}>
              {i > 0 && <div className="mx-5 h-px" style={{ background: "#E6E4D9" }} />}
              <Link href={item.href} className="flex items-center justify-between px-5 py-4 press-feedback">
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "#17271F" }}>{item.label}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{item.sub}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="px-5 mt-6 mb-4">
        <button
          type="button"
          onClick={logout}
          className="w-full h-[50px] rounded-full text-[14px] font-bold cursor-pointer press-feedback"
          style={{ background: "var(--sand)", color: "var(--coral)" }}
        >
          Log out
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
