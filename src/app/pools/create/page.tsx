"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMOJIS = ["🍛", "🔥", "🍗", "🍕", "🌶️"];

export default function CreateGangPage() {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState(0);
  const [creating, setCreating] = useState(false);
  const [gangName, setGangName] = useState("");
  const [motto, setMotto] = useState("");
  const [campus, setCampus] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [waLink, setWaLink] = useState("");

  return (
    <main className="min-h-svh" style={{ background: "var(--bg)" }}>
      <div className="max-w-[480px] mx-auto w-full px-5 pb-8">

        {/* ── Header ── */}
        <div className="pt-4 flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs · Your forever food crew</p>
            <p className="text-[14px] font-extrabold" style={{ color: "#17271F", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Bring your people</p>
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--sand)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
          </button>
        </div>

        {/* ── Hero ── */}
        <div className="mt-6">
          <h1 className="text-[32px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "#17271F" }}>
            Same gang.<br />Better chop.
          </h1>
          <p className="text-[14px] mt-2 leading-[145%]" style={{ color: "var(--text-muted)" }}>
            A home for your food people — not just one pool.
          </p>
        </div>

        {/* ── Give the gang a face ── */}
        <div className="mt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--coral)" }}>Give the gang a face</p>
          <div className="flex gap-3">
            {EMOJIS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedEmoji(i)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-[22px] cursor-pointer"
                style={{
                  background: selectedEmoji === i ? "var(--lime)" : "var(--sand)",
                  border: selectedEmoji === i ? "2px solid #17271F" : "2px solid transparent",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* ── Gang name ── */}
        <div className="mt-6">
          <label className="text-[12px] font-bold block mb-1.5" style={{ color: "#17271F" }}>Gang name</label>
          <input
            type="text"
            value={gangName}
            onChange={(e) => setGangName(e.target.value)}
            placeholder="The Lunch Crew"
            className="w-full h-[48px] px-4 rounded-[12px] text-[14px] font-medium outline-none"
            style={{ background: "var(--card)", color: "#17271F", border: "1px solid var(--border)" }}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>The name your people will recognise.</p>
        </div>

        {/* ── Gang motto ── */}
        <div className="mt-5">
          <label className="text-[12px] font-bold block mb-1.5" style={{ color: "#17271F" }}>Gang motto</label>
          <input
            type="text"
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            placeholder="We eat together, we save together"
            className="w-full h-[48px] px-4 rounded-[12px] text-[14px] font-medium outline-none"
            style={{ background: "var(--card)", color: "#17271F", border: "1px solid var(--border)" }}
          />
        </div>

        {/* ── Area ── */}
        <div className="mt-5">
          <label className="text-[12px] font-bold block mb-1.5" style={{ color: "#17271F" }}>Area</label>
          <div className="relative">
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[12px] text-[14px] font-medium outline-none appearance-none cursor-pointer"
              style={{ background: "var(--card)", color: "#17271F", border: "1px solid var(--border)" }}
            >
              <option value="">Select area</option>
              <option>Ikeja</option>
              <option>Lekki</option>
              <option>Victoria Island</option>
              <option>Yaba</option>
              <option>Surulere</option>
              <option>Ajah</option>
              <option>Ikoyi</option>
            </select>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>

        {/* ── Delivery address ── */}
        <div className="mt-5">
          <label className="text-[12px] font-bold block mb-1.5" style={{ color: "#17271F" }}>Delivery address</label>
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="e.g. 14 Mobolaji Bank-Anthony Way, Ikeja"
            className="w-full h-[48px] px-4 rounded-[12px] text-[14px] font-medium outline-none"
            style={{ background: "var(--card)", color: "#17271F", border: "1px solid var(--border)" }}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>Where food gets delivered. Pre-fills for every group order.</p>
        </div>

        {/* ── WhatsApp group ── */}
        <div className="mt-5">
          <div className="p-4 rounded-[22px]" style={{ background: "var(--emerald-soft)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--card)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "#17271F" }}>Connect a WhatsApp group</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Optional. Add your group&apos;s invite link so members can find the chat.</p>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-1"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <input
              type="text"
              value={waLink}
              onChange={(e) => setWaLink(e.target.value)}
              placeholder="Paste WhatsApp group invite link..."
              className="w-full h-[40px] px-3 mt-3 rounded-[10px] text-[13px] font-medium outline-none"
              style={{ background: "var(--card)", color: "#17271F", border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        {/* ── Note ── */}
        <p className="text-[12px] mt-5 leading-[155%]" style={{ color: "var(--text-muted)" }}>
          After creating, invite friends with your gang link or share it on WhatsApp. You&apos;ll be the gang admin.
        </p>

        {/* ── CTA ── */}
        <button
          type="button"
          disabled={!gangName.trim() || creating}
          onClick={async () => {
            setCreating(true);
            try {
              const res = await fetch("/api/gangs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: gangName.trim(), emoji: EMOJIS[selectedEmoji], motto: motto.trim() || undefined, campus: campus || undefined, deliveryAddress: deliveryAddress.trim() || undefined, whatsappLink: waLink.trim() || undefined }),
              });
              const data = await res.json();
              if (data.success) { router.push(`/pools/${data.data.id}`); }
              else { alert(data.error || "Couldn't create gang"); setCreating(false); }
            } catch { alert("Network error"); setCreating(false); }
          }}
          className="w-full h-[54px] rounded-full flex items-center justify-between px-6 text-[15px] font-bold text-white cursor-pointer press-feedback disabled:opacity-50 mt-5"
          style={{ background: "var(--coral)" }}
        >
          <span>Create {gangName || "gang"}</span>
          <svg width="20" height="18" viewBox="0 0 35 32" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round"><path d="M24.035 30.7V27.366c0-1.768-.702-3.464-1.953-4.714a6.667 6.667 0 0 0-4.714-1.953H7.367a6.667 6.667 0 0 0-4.714 1.953A6.667 6.667 0 0 0 .7 27.366V30.7M24.035.912a6.667 6.667 0 0 1 3.6 2.374 6.667 6.667 0 0 1 0 8.16 6.667 6.667 0 0 1-3.6 2.373M34.036 30.699V27.366a6.667 6.667 0 0 0-1.398-4.08 6.667 6.667 0 0 0-3.602-2.387M19.035 7.366a6.667 6.667 0 1 1-13.335 0 6.667 6.667 0 0 1 13.335 0z" /></svg>
        </button>

      </div>
    </main>
  );
}
