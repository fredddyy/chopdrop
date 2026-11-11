"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── Gang color avatars (replaces banned emoji) ── */
const GANG_FACES = [
  { color: "#C4572A", initial: "J", label: "Jollof" },
  { color: "#1A7D4B", initial: "S", label: "Suya" },
  { color: "#D4A24E", initial: "P", label: "Pepper" },
  { color: "#1C1C1E", initial: "O", label: "Ofada" },
  { color: "#6366F1", initial: "A", label: "Amala" },
];

const AREAS = [
  "Ikeja", "Lekki", "Victoria Island", "Yaba", "Surulere",
  "Ajah", "Ikoyi", "Gbagada", "Maryland", "Festac", "Magodo", "Apapa",
];

export default function CreateGangPage() {
  const router = useRouter();
  const [selectedFace, setSelectedFace] = useState(0);
  const [creating, setCreating] = useState(false);
  const [gangName, setGangName] = useState("");
  const [motto, setMotto] = useState("");
  const [campus, setCampus] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [waLink, setWaLink] = useState("");
  const [error, setError] = useState("");

  const face = GANG_FACES[selectedFace];
  const nameReady = gangName.trim().length > 0;

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/gangs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gangName.trim(),
          emoji: face.initial,
          motto: motto.trim() || undefined,
          campus: campus || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          whatsappLink: waLink.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/pools/${data.data.id}`);
      } else {
        setError(data.error || "Something went wrong. Try again.");
        setCreating(false);
      }
    } catch {
      setError("Couldn\u2019t reach ChopDrop. Check your connection and try again.");
      setCreating(false);
    }
  }

  return (
    <main className="min-h-svh" style={{ background: "var(--bg)" }}>
      <div className="max-w-[428px] mx-auto w-full px-5 pb-10">

        {/* ── Header ── */}
        <div className="pt-4 flex items-center justify-between">
          <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)", lineHeight: "130%" }}>Gangs</p>
            <p className="text-[14px] font-extrabold" style={{ color: "var(--text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Start a food crew</p>
          </div>
          <div className="w-11" />
        </div>

        {/* ── Hero ── */}
        <div className="mt-7">
          <h1 className="text-[32px] font-extrabold leading-[108%]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.8px", color: "var(--text)" }}>
            Same gang.<br />Better chop.
          </h1>
          <p className="text-[14px] mt-2 leading-[145%]" style={{ color: "var(--text-muted)" }}>
            Order together, save together. More people in your gang means cheaper plates for everyone.
          </p>
        </div>

        {/* ── Savings hook — the value proposition ── */}
        <div className="mt-5 flex gap-2">
          {[
            { n: "3+", label: "people", save: "10% off" },
            { n: "5+", label: "people", save: "20% off" },
            { n: "10+", label: "people", save: "30% off" },
          ].map((tier) => (
            <div key={tier.n} className="flex-1 rounded-[12px] py-2.5 px-2 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[18px] font-extrabold tabular-nums leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{tier.n}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{tier.label}</p>
              <p className="text-[11px] font-extrabold mt-1" style={{ color: "var(--emerald)" }}>{tier.save}</p>
            </div>
          ))}
        </div>

        {/* ═══ FORM ═══ */}

        {/* ── Section: Identity ── */}
        <div className="mt-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-4" style={{ color: "var(--coral)" }}>Your gang&apos;s identity</p>

          {/* Gang name (required) */}
          <div>
            <label htmlFor="gang-name" className="text-[12px] font-bold block mb-1.5" style={{ color: "var(--text)" }}>
              Gang name <span style={{ color: "var(--coral)" }}>*</span>
            </label>
            <input
              id="gang-name"
              type="text"
              value={gangName}
              onChange={(e) => setGangName(e.target.value)}
              placeholder="The Lunch Crew"
              maxLength={40}
              autoComplete="off"
              className="w-full h-[48px] px-4 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>The name your people will recognise.</p>
          </div>

          {/* Gang face (color avatars) */}
          <div className="mt-5">
            <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text)" }}>Pick a vibe</p>
            <div className="flex gap-2.5">
              {GANG_FACES.map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setSelectedFace(i)}
                  aria-label={`Select ${f.label} avatar`}
                  className="flex flex-col items-center gap-1 press-feedback"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-extrabold text-white"
                    style={{
                      background: f.color,
                      outline: selectedFace === i ? "2.5px solid var(--text)" : "2.5px solid transparent",
                      outlineOffset: "2px",
                      transition: "outline 150ms ease-out",
                    }}
                  >
                    {f.initial}
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: selectedFace === i ? "var(--text)" : "var(--text-muted)" }}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Motto (optional) */}
          <div className="mt-5">
            <label htmlFor="gang-motto" className="text-[12px] font-bold block mb-1.5" style={{ color: "var(--text)" }}>
              Motto <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>optional</span>
            </label>
            <input
              id="gang-motto"
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="We eat together, we save together"
              maxLength={80}
              autoComplete="off"
              className="w-full h-[48px] px-4 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>

          {/* Live preview — visible while typing */}
          {nameReady && (
            <div className="mt-5 p-3.5 rounded-[16px]" style={{ background: "#1C1C1E" }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[16px] font-extrabold text-white shrink-0" style={{ background: face.color }}>
                  {gangName.trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-extrabold text-white truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{gangName.trim()}</p>
                  <p className="text-[11px]" style={{ color: "var(--subdued)" }}>
                    1 member{campus ? ` \u00B7 ${campus}` : ""}{motto.trim() ? ` \u00B7 "${motto.trim()}"` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Logistics ── */}
        <div className="mt-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-4" style={{ color: "var(--coral)" }}>Where you chop</p>

          {/* Delivery address */}
          <div>
            <label htmlFor="delivery-addr" className="text-[12px] font-bold block mb-1.5" style={{ color: "var(--text)" }}>
              Delivery address
            </label>
            <input
              id="delivery-addr"
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="e.g. 14 Mobolaji Bank-Anthony Way, Ikeja"
              autoComplete="street-address"
              className="w-full h-[48px] px-4 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>Pre-fills for every group order. Save your people the typing.</p>
          </div>

          {/* Area */}
          <div className="mt-5">
            <label htmlFor="gang-area" className="text-[12px] font-bold block mb-1.5" style={{ color: "var(--text)" }}>Area</label>
            <div className="relative">
              <select
                id="gang-area"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[12px] text-[14px] font-medium outline-none appearance-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
              >
                <option value="">Select area</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>
        </div>

        {/* ── WhatsApp (optional, compact) ── */}
        <div className="mt-8">
          <div className="p-4 rounded-[16px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#25D366" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold" style={{ color: "var(--text)" }}>Link a WhatsApp group</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Optional. So members can find the chat</p>
              </div>
            </div>
            <input
              type="url"
              value={waLink}
              onChange={(e) => setWaLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              aria-label="WhatsApp group invite link"
              className="w-full h-[40px] px-3 mt-3 rounded-[10px] text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
              style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mt-4 p-3.5 rounded-[12px] flex items-start gap-2.5" style={{ background: "#FEF2F0", border: "1px solid #FECACA" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <div>
              <p className="text-[13px] font-bold" style={{ color: "var(--coral)" }}>{error}</p>
              <button type="button" onClick={() => setError("")} className="text-[12px] font-bold mt-1 press-feedback" style={{ color: "var(--text-muted)" }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* ── Note ── */}
        <p className="text-[12px] mt-5 leading-[155%]" style={{ color: "var(--text-muted)" }}>
          You&apos;ll be the gang admin. After creating, share your link or invite via WhatsApp.
        </p>

        {/* ── CTA — architectural, not pill ── */}
        <button
          type="button"
          disabled={!nameReady || creating}
          onClick={handleCreate}
          className="w-full h-[50px] rounded-[12px] flex items-center justify-between px-5 text-[15px] font-bold text-white press-feedback disabled:opacity-50 mt-4"
          style={{ background: "var(--coral)", transition: "opacity 150ms ease-out" }}
        >
          <span>{creating ? "Creating\u2026" : `Create ${gangName.trim() || "gang"}`}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>

      </div>
    </main>
  );
}
