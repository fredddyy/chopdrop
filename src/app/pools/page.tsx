import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

export default function PoolsPage() {
  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em]" style={{ color: "var(--text)" }}>Pools</h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>Group buying pools near you</p>
      </div>

      <div className="flex flex-col items-center py-16 px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--sand)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h2 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text)" }}>No active pools yet</h2>
        <p className="text-[14px] mb-6 text-center" style={{ color: "var(--text-muted)" }}>Start a pool from any product and share it with friends to unlock group pricing</p>
        <Link href="/discover" className="h-11 px-6 rounded-[12px] text-[14px] font-bold text-white inline-flex items-center" style={{ background: "var(--coral)" }}>Browse products</Link>
      </div>

      <BottomNav />
    </main>
  );
}
