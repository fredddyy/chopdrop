"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

type Tab = "pools" | "members" | "activity";

const AVATAR_COLORS = ["#17271F", "#EF502B", "#246347", "#F8CB57", "#E6DEF6"];

const ACTIVITY = [
  { name: "Funke", initial: "F", action: "joined the Amala + Ewedu pool.", time: "1 min ago", link: "Amala · ₦650 · 33/35 in →", color: 0 },
  { name: "Dami", initial: "D", action: "shared the amala pool with the gang.", time: "6 min ago", detail: "2 spots left · Jaja Reception →", color: 1 },
  { name: "Zainab", initial: "Z", action: "joined Jollof Rice + Chicken.", time: "16 min ago", link: "Jollof · ₦900 · 21/30 in →", color: 2 },
  { name: "Tomi", initial: "T", action: "gave Mama T's Kitchen 5 stars.", time: "Yesterday · 6:12 pm", quote: '"Proper amala. No regrets." →', color: 3 },
  { name: "Chika", initial: "C", action: "joined Block C Foodies.", time: "Yesterday · 11:20 am", detail: "Say hello to your newest foodie 🍛", color: 4 },
];

export default function GangDetailPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("activity");

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs · Block C Foodies</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>The gang&apos;s gist</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Gang profile ── */}
      <div className="px-5 mt-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] shrink-0" style={{ background: "var(--sand)" }}>
          🍛
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Block C Foodies</h1>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>8 members · UNILAG</p>
        </div>
      </div>

      <p className="px-5 mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>&ldquo;We eat together, we save together&rdquo;</p>

      {/* ── Share buttons ── */}
      <div className="px-5 mt-3 flex gap-2">
        <button className="h-[25px] px-3 rounded-full text-[11px] font-bold cursor-pointer" style={{ background: "#17271F", color: "white" }}>
          Share invite link
        </button>
        <button className="h-[25px] px-3 rounded-full text-[11px] font-bold cursor-pointer" style={{ background: "var(--sand)", color: "#17271F" }}>
          WhatsApp invite
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="px-5 mt-5 flex">
        {(["pools", "members", "activity"] as Tab[]).map((t) => (
          <button
            key={t} type="button" onClick={() => setTab(t)}
            className="flex-1 h-[40px] text-[13px] font-bold cursor-pointer rounded-full"
            style={{ background: tab === t ? "#17271F" : "transparent", color: tab === t ? "white" : "var(--text-muted)" }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "activity" && (
        <>
          {/* ── Stats ── */}
          <div className="px-5 mt-4">
            <div className="p-4 rounded-[22px]" style={{ background: "var(--lime)" }}>
              <p className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Good food travels fast.</p>
              <p className="text-[12px] mt-0.5" style={{ color: "#17271F", opacity: 0.6 }}>3 pool joins and 1 share today</p>
            </div>
          </div>

          {/* ── Activity feed ── */}
          <div className="px-5 mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Around the table</h3>
              <span className="text-[12px] font-bold" style={{ color: "var(--coral)" }}>Recent</span>
            </div>

            <div className="flex flex-col gap-5">
              {ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: AVATAR_COLORS[item.color % AVATAR_COLORS.length] }}>
                    {item.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] leading-[145%]" style={{ color: "#17271F" }}>
                      <span className="font-bold">{item.name}</span> {item.action}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.time}</p>
                    {item.link && (
                      <p className="text-[12px] font-bold mt-1.5" style={{ color: "var(--coral)" }}>{item.link}</p>
                    )}
                    {item.detail && (
                      <p className="text-[12px] mt-1.5" style={{ color: "var(--text-muted)" }}>{item.detail}</p>
                    )}
                    {item.quote && (
                      <p className="text-[12px] mt-1.5" style={{ color: "var(--coral)" }}>{item.quote}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-center mt-6" style={{ color: "var(--text-muted)" }}>
              All caught up. Your next good hatch is on the Pools tab.
            </p>
          </div>
        </>
      )}

      {tab === "pools" && (
        <div className="px-5 mt-8 text-center">
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>No active gang pools. Start one from a vendor page.</p>
          <Link href="/discover" className="mt-3 text-[13px] font-bold inline-block" style={{ color: "var(--coral)" }}>Browse deals →</Link>
        </div>
      )}

      {tab === "members" && (
        <div className="px-5 mt-4">
          <div className="rounded-[22px] overflow-hidden" style={{ background: "var(--card)" }}>
            {["Funke (Admin)", "Dami", "Zainab", "Tomi", "Chika", "Ada", "Emeka", "Bimpe"].map((name, i) => (
              <div key={name}>
                {i > 0 && <div className="mx-5 h-px" style={{ background: "#E6E4D9" }} />}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {name.charAt(0)}
                  </div>
                  <span className="text-[14px] font-medium" style={{ color: "#17271F" }}>{name}</span>
                  {name.includes("Admin") && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>Creator</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-[13px] font-bold cursor-pointer flex items-center gap-1.5" style={{ color: "var(--coral)" }} onClick={() => { if (navigator.share) navigator.share({ title: "Join Block C Foodies on ChopDrop", text: "Join our food gang!", url: window.location.href }); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6" /></svg>
            Invite people
          </button>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
