"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

export default function GangDetailPage() {
  const router = useRouter();

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs</p>
          <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Your gang</p>
        </div>
        <div className="w-9" />
      </div>

      {/* ── Coming soon state ── */}
      <div className="px-5 mt-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--lime)" }}>
          <svg width="28" height="28" viewBox="0 0 35 32" fill="none" stroke="#17271F" strokeWidth="1.4" strokeLinecap="round"><path d="M24.035 30.7V27.366c0-1.768-.702-3.464-1.953-4.714a6.667 6.667 0 0 0-4.714-1.953H7.367a6.667 6.667 0 0 0-4.714 1.953A6.667 6.667 0 0 0 .7 27.366V30.7M24.035.912a6.667 6.667 0 0 1 3.6 2.374 6.667 6.667 0 0 1 0 8.16 6.667 6.667 0 0 1-3.6 2.373M34.036 30.699V27.366a6.667 6.667 0 0 0-1.398-4.08 6.667 6.667 0 0 0-3.602-2.387M19.035 7.366a6.667 6.667 0 1 1-13.335 0 6.667 6.667 0 0 1 13.335 0z" /></svg>
        </div>
        <h1 className="text-[24px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#17271F" }}>Gangs are cooking.</h1>
        <p className="text-[13px] mt-2 leading-[155%]" style={{ color: "var(--text-muted)" }}>
          Your food crew — pools, activity, and members — all in one place. Coming very soon.
        </p>
        <Link href="/discover" className="h-[40px] px-5 rounded-full text-[13px] font-bold text-white inline-flex items-center mt-5 press-feedback" style={{ background: "var(--coral)" }}>Browse deals</Link>
      </div>

      <BottomNav />
    </main>
  );
}
