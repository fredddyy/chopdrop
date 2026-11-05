"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

export default function GangsPage() {
  const [inviteLink, setInviteLink] = useState("");

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs</p>
            <span className="text-[18px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Chop<span style={{ color: "var(--coral)" }}>Drop</span>
            </span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="px-5 mt-5">
        <h1 className="text-[28px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "#17271F" }}>
          Good chop needs<br />good company.
        </h1>
        <p className="text-[14px] mt-2 leading-[145%]" style={{ color: "var(--text-muted)" }}>
          Create your food gang or join your friends. Your people make it easier to find and fill better-priced pools.
        </p>
      </div>

      {/* ── Start your crew — lime CTA card ── */}
      <div className="px-5 mt-5">
        <div className="p-5 rounded-[22px]" style={{ background: "var(--lime)" }}>
          <h3 className="text-[20px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Start your crew.</h3>
          <p className="text-[13px] mt-1 leading-[155%]" style={{ color: "#17271F", opacity: 0.7 }}>
            Roommates, coursemates, late-night foodies — give your table a name and bring them together.
          </p>
          <Link href="/pools/create" className="mt-4 h-[44px] rounded-full flex items-center justify-between px-5 text-[14px] font-bold text-white press-feedback" style={{ background: "var(--coral)" }}>
            <span>Create a gang</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </Link>
        </div>
      </div>

      {/* ── Got an invite? ── */}
      <div className="px-5 mt-5">
        <div className="p-5 rounded-[22px]" style={{ background: "var(--card)" }}>
          <h3 className="text-[17px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Got an invite?</h3>
          <p className="text-[13px] mt-1 leading-[145%]" style={{ color: "var(--text-muted)" }}>
            Paste a gang invite link from your friends to find their table.
          </p>
          <div className="mt-3">
            <label className="text-[12px] font-bold block mb-1.5" style={{ color: "#17271F" }}>Gang invite link</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Paste your invite link"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                className="w-full h-[44px] px-4 pr-10 rounded-[12px] text-[14px] font-medium outline-none"
                style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute right-3 top-1/2 -translate-y-1/2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </div>
          </div>
          <button className="mt-3 text-[13px] font-bold cursor-pointer flex items-center gap-1.5" style={{ color: "#17271F" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            Find &amp; join a gang
          </button>
        </div>
      </div>

      {/* ── Why eat as a gang? ── */}
      <div className="px-5 mt-6">
        <h3 className="text-[17px] font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Why eat as a gang?</h3>
        <div className="space-y-3.5">
          {[
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>, text: "Discover pools your friends rate" },
            { icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--coral)" strokeWidth="1.4" strokeLinecap="round"><path d="M5 11.667c0 2.163.702 4.269 2 6 .265.353.66.587 1.098.65.437.062.882-.052 1.235-.317.354-.265.588-.66.65-1.098.063-.437-.051-.882-.316-1.235A6.644 6.644 0 018.333 11.667M5 11.667h1.667m1.666 0h.834c2.534-.066 5.012.76 7 2.333.124.093.271.15.425.163.154.014.31-.015.448-.084.138-.07.255-.176.336-.308.081-.131.125-.283.125-.438V3.333c0-.155-.044-.306-.125-.438a.832.832 0 00-.336-.308.834.834 0 00-.448-.084.834.834 0 00-.425.164c-1.989 1.573-4.466 2.398-7 2.333H6.667 4.167c-.442 0-.866.176-1.179.488A1.667 1.667 0 002.5 6.667V10c0 .442.176.866.488 1.179.313.312.737.488 1.179.488H5m3.333 0H6.667m0-6.667v6.667" /></svg>, text: "Request the meals you all want" },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>, text: "Invite more people to fill a pool" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.icon}
              <span className="text-[14px] font-medium" style={{ color: "#17271F" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust note ── */}
      <div className="px-5 mt-6 mb-4">
        <div className="flex items-start gap-2.5 p-4 rounded-[16px]" style={{ background: "var(--emerald-soft)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          <p className="text-[12px] leading-[155%]" style={{ color: "var(--emerald)" }}>
            A gang is your food crew, not a shared bill. Everyone chooses and pays for their own plates.
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
