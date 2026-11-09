"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

const FACE_COLORS = ["#C4572A", "#1A7D4B", "#D4A24E", "#1C1C1E", "#6366F1"];

interface Gang {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  campus: string | null;
  myRole: string;
}

export default function GangsPage() {
  const router = useRouter();
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const fetchGangs = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/gangs?mine=true")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setGangs(d.data || []);
        else setError(true);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { fetchGangs(); }, [fetchGangs]);

  async function handleJoinInvite() {
    const link = inviteLink.trim();
    if (!link) return;
    setJoining(true);
    setJoinError("");
    // Extract gang/pool ID from URL or use as-is
    const match = link.match(/\/pools\/([a-zA-Z0-9]+)/);
    const gangId = match ? match[1] : link;
    try {
      const res = await fetch(`/api/gangs/${gangId}/join`, { method: "POST" });
      const d = await res.json();
      if (d.success) {
        router.push(`/pools/${gangId}`);
        return;
      }
      if (d.error === "Already a member") {
        router.push(`/pools/${gangId}`);
        return;
      }
      setJoinError(d.error || "Couldn\u2019t join. Check the link and try again.");
    } catch {
      setJoinError("Couldn\u2019t reach ChopDrop. Check your connection.");
    }
    setJoining(false);
  }

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="18" viewBox="0 0 35 32" fill="none" stroke="var(--coral)" strokeWidth="1.4" strokeLinecap="round"><path d="M24.035 30.7V27.366c0-1.768-.702-3.464-1.953-4.714a6.667 6.667 0 0 0-4.714-1.953H7.367a6.667 6.667 0 0 0-4.714 1.953A6.667 6.667 0 0 0 .7 27.366V30.7M24.035.912a6.667 6.667 0 0 1 3.6 2.374 6.667 6.667 0 0 1 0 8.16 6.667 6.667 0 0 1-3.6 2.373M34.036 30.699V27.366a6.667 6.667 0 0 0-1.398-4.08 6.667 6.667 0 0 0-3.602-2.387M19.035 7.366a6.667 6.667 0 1 1-13.335 0 6.667 6.667 0 0 1 13.335 0z" /></svg>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs</p>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "var(--text)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
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
        <h1 className="text-[28px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "var(--text)" }}>
          Good chop needs<br />good company.
        </h1>
        <p className="text-[13px] mt-1.5" style={{ color: "var(--text-muted)" }}>
          More people in your gang = cheaper plates for everyone.
        </p>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="px-5 mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[76px] rounded-[16px]" style={{ background: "var(--sand)", opacity: 0.7, animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : error ? (
        <div className="px-5 mt-6">
          <div className="p-5 rounded-[16px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>Couldn&apos;t load your gangs</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Check your connection and try again.</p>
            <button type="button" onClick={fetchGangs} className="mt-3 h-[44px] px-5 rounded-full text-[13px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>
              Try again
            </button>
          </div>
        </div>
      ) : gangs.length > 0 ? (
        <div className="px-5 mt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--coral)" }}>Your gangs</p>
          <div className="flex flex-col gap-2.5">
            {gangs.map((gang, i) => {
              const faceColor = FACE_COLORS[i % FACE_COLORS.length];
              const initial = gang.emoji?.length === 1 && /[A-Za-z]/.test(gang.emoji)
                ? gang.emoji.toUpperCase()
                : gang.name.charAt(0).toUpperCase();
              return (
                <Link
                  key={gang.id}
                  href={`/pools/${gang.id}`}
                  className={`flex items-center gap-3 p-3.5 rounded-[16px] press-feedback card-enter card-enter-${i + 1}`}
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-[16px] font-extrabold text-white shrink-0" style={{ background: faceColor }}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>{gang.name}</h4>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {gang.memberCount} member{gang.memberCount !== 1 ? "s" : ""}{gang.campus ? ` \u00B7 ${gang.campus}` : ""}
                    </p>
                  </div>
                  {gang.myRole === "ADMIN" && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wide shrink-0" style={{ color: "var(--coral)" }}>Admin</span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Empty state — dark CTA ── */
        <div className="px-5 mt-6">
          <div className="p-5 rounded-[16px]" style={{ background: "#1C1C1E" }}>
            <h3 className="text-[18px] font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Start your crew.</h3>
            <p className="text-[13px] mt-1 leading-[155%]" style={{ color: "var(--subdued)" }}>
              Friends, neighbours, colleagues — your regular food crew. Order together, split delivery, save up to 30%.
            </p>
            <Link href="/pools/create" className="mt-4 h-[50px] rounded-full flex items-center justify-between px-5 text-[14px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>
              <span>Create a gang</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      )}

      {/* ── Join via invite ── */}
      <div className="px-5 mt-6">
        <div className="p-4 rounded-[16px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Got an invite?</h3>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>Paste a gang link from your friends.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="url"
              placeholder="Paste invite link"
              value={inviteLink}
              onChange={(e) => { setInviteLink(e.target.value); setJoinError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoinInvite(); }}
              aria-label="Gang invite link"
              className="flex-1 h-[44px] px-3.5 rounded-[12px] text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] min-w-0"
              style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <button
              type="button"
              onClick={handleJoinInvite}
              disabled={!inviteLink.trim() || joining}
              className="h-[44px] px-4 rounded-full text-[13px] font-bold text-white press-feedback disabled:opacity-50 shrink-0"
              style={{ background: "var(--coral)" }}
            >
              {joining ? "Joining\u2026" : "Join"}
            </button>
          </div>
          {joinError && <p className="text-[11px] font-bold mt-2" style={{ color: "var(--coral)" }}>{joinError}</p>}
        </div>
      </div>

      {/* ── Value hook ── */}
      <div className="px-5 mt-5 mb-4">
        <div className="flex gap-2">
          {[
            { n: "3+", save: "10% off" },
            { n: "5+", save: "20% off" },
            { n: "10+", save: "30% off" },
          ].map((tier) => (
            <div key={tier.n} className="flex-1 rounded-[12px] py-2.5 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[16px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{tier.n}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>people</p>
              <p className="text-[11px] font-extrabold mt-0.5" style={{ color: "var(--emerald)" }}>{tier.save}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
