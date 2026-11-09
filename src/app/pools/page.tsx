"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

const AVATAR_COLORS = ["#1C1C1E", "#E84C3D", "#22C55E", "#D4A43A", "#6366F1"];

interface Gang {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  campus: string | null;
  role: string;
}

export default function GangsPage() {
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    fetch("/api/gangs?mine=true")
      .then((r) => r.json())
      .then((d) => { if (d.success) setGangs(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="18" viewBox="0 0 35 32" fill="none" stroke="var(--coral)" strokeWidth="1.4" strokeLinecap="round"><path d="M24.035 30.7V27.366c0-1.768-.702-3.464-1.953-4.714a6.667 6.667 0 0 0-4.714-1.953H7.367a6.667 6.667 0 0 0-4.714 1.953A6.667 6.667 0 0 0 .7 27.366V30.7M24.035.912a6.667 6.667 0 0 1 3.6 2.374 6.667 6.667 0 0 1 0 8.16 6.667 6.667 0 0 1-3.6 2.373M34.036 30.699V27.366a6.667 6.667 0 0 0-1.398-4.08 6.667 6.667 0 0 0-3.602-2.387M19.035 7.366a6.667 6.667 0 1 1-13.335 0 6.667 6.667 0 0 1 13.335 0z" /></svg>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs</p>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#1C1C1E", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Chop<span style={{ color: "var(--coral)" }}>Drop</span>
            </span>
          </div>
        </div>
        <Link href="/pools/create" className="h-[32px] px-4 rounded-full text-[12px] font-bold text-white inline-flex items-center gap-1.5 press-feedback" style={{ background: "var(--coral)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New gang
        </Link>
      </div>

      {/* ── Hero ── */}
      <div className="px-5 mt-5">
        <h1 className="text-[28px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "#1C1C1E" }}>
          Good chop needs<br />good company.
        </h1>
      </div>

      {/* ── My Gangs ── */}
      {loading ? (
        <div className="px-5 mt-5 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[80px] rounded-[22px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : gangs.length > 0 ? (
        <div className="px-5 mt-5">
          <p className="text-[12px] font-bold mb-3" style={{ color: "var(--text-muted)" }}>Your gangs</p>
          <div className="flex flex-col gap-3">
            {gangs.map((gang, i) => (
              <Link key={gang.id} href={`/pools/${gang.id}`} className="flex items-center gap-3 p-4 rounded-[22px] press-feedback" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[22px] shrink-0" style={{ background: "var(--sand)" }}>
                  {gang.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold truncate" style={{ color: "#1C1C1E" }}>{gang.name}</h4>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{gang.memberCount} member{gang.memberCount !== 1 ? "s" : ""}{gang.campus ? ` · ${gang.campus}` : ""}</p>
                </div>
                {gang.role === "ADMIN" && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "#FEF2F0", color: "var(--coral)" }}>Admin</span>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* No gangs — show create CTA */
        <div className="px-5 mt-5">
          <div className="p-5 rounded-[22px]" style={{ background: "#1C1C1E" }}>
            <h3 className="text-[18px] font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Start your crew.</h3>
            <p className="text-[13px] mt-1 leading-[155%]" style={{ color: "var(--subdued)" }}>
              Friends, neighbours, colleagues — your regular food crew. Order together, split delivery.
            </p>
            <Link href="/pools/create" className="mt-4 h-[44px] rounded-full flex items-center justify-between px-5 text-[14px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>
              <span>Create a gang</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </Link>
          </div>
        </div>
      )}

      {/* ── Got an invite? ── */}
      <div className="px-5 mt-5">
        <div className="p-5 rounded-[22px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Got an invite?</h3>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Paste a gang invite link from your friends.</p>
          <div className="mt-3 relative">
            <input
              type="text" placeholder="Paste invite link"
              value={inviteLink} onChange={(e) => setInviteLink(e.target.value)}
              className="w-full h-[44px] px-4 pr-10 rounded-[12px] text-[14px] font-medium outline-none"
              style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute right-3 top-1/2 -translate-y-1/2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
          </div>
        </div>
      </div>

      {/* ── Trust note ── */}
      <div className="px-5 mt-5 mb-4">
        <div className="flex items-start gap-2.5 p-4 rounded-[16px]" style={{ background: "var(--emerald-soft)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          <p className="text-[12px] leading-[155%]" style={{ color: "var(--emerald)" }}>
            A gang is your food crew. Order together, split delivery, everyone pays for their own plates.
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
