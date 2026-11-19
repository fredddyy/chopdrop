"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

const AVATARS = Array.from({ length: 9 }, (_, i) => `/avatars/${i + 1}.png`);

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setFirstName(d.data.firstName || "");
          setLastName(d.data.lastName || "");
          setPhone(d.data.phone || "");
          setEmail(d.data.email || "");
          setAvatarUrl(d.data.avatarUrl || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, avatarUrl }),
      });
      const data = await res.json();
      if (data.success) {
        // Update localStorage too
        try {
          const stored = localStorage.getItem("chopdrop-customer");
          const profile = stored ? JSON.parse(stored) : {};
          localStorage.setItem("chopdrop-customer", JSON.stringify({ ...profile, name: `${firstName} ${lastName}`.trim() }));
        } catch {}
        setToast("Profile updated");
        setTimeout(() => setToast(""), 2000);
      }
    } catch {}
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6 space-y-4">
          <div className="h-8 w-32 rounded-lg" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="w-20 h-20 rounded-full mx-auto" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-12 rounded-[12px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-12 rounded-[12px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-5 pt-4 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-[12px] flex items-center justify-center press-feedback shrink-0" style={{ background: "var(--sand)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 className="text-[18px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>Edit profile</h1>
      </div>

      {/* Current avatar */}
      <div className="flex flex-col items-center mt-6">
        <div className="w-[80px] h-[80px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: "var(--sand)" }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[28px] font-extrabold" style={{ color: "var(--text-muted)" }}>{firstName.charAt(0) || "?"}</span>
          )}
        </div>
        <p className="text-[12px] font-bold mt-2" style={{ color: "var(--coral)" }}>Choose your avatar</p>
      </div>

      {/* Avatar picker — 3x3 grid */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-3 gap-3">
          {AVATARS.map(url => (
            <button key={url} type="button" onClick={() => setAvatarUrl(url)}
              className="aspect-square rounded-[16px] overflow-hidden flex items-center justify-center press-feedback"
              style={{
                background: "var(--sand)",
                border: avatarUrl === url ? "3px solid var(--coral)" : "3px solid transparent",
                transition: "border-color 150ms ease-out",
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Form fields */}
      <div className="px-5 mt-6 space-y-3">
        <div>
          <label className="text-[11px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>First name</label>
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
            className="w-full h-[44px] px-3.5 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
            style={{ background: "var(--sand)", color: "var(--text)" }} />
        </div>
        <div>
          <label className="text-[11px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>Last name</label>
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
            className="w-full h-[44px] px-3.5 rounded-[12px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
            style={{ background: "var(--sand)", color: "var(--text)" }} />
        </div>
        <div>
          <label className="text-[11px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>Phone</label>
          <input type="tel" value={phone} disabled
            className="w-full h-[44px] px-3.5 rounded-[12px] text-[14px] font-medium outline-none opacity-50"
            style={{ background: "var(--sand)", color: "var(--text)" }} />
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Phone number can&apos;t be changed</p>
        </div>
        <div>
          <label className="text-[11px] font-bold block mb-1" style={{ color: "var(--text-muted)" }}>Email</label>
          <input type="email" value={email} disabled
            className="w-full h-[44px] px-3.5 rounded-[12px] text-[14px] font-medium outline-none opacity-50"
            style={{ background: "var(--sand)", color: "var(--text)" }} />
        </div>
      </div>

      {/* Save button */}
      <div className="px-5 mt-6">
        <button type="button" onClick={handleSave} disabled={saving}
          className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold text-white press-feedback disabled:opacity-50"
          style={{ background: "var(--coral)" }}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed z-[100] left-0 right-0 bottom-[80px] px-5 celebrate">
          <div className="max-w-[428px] mx-auto flex items-center justify-center gap-2 rounded-lg px-4 py-3" style={{ background: "var(--emerald)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            <span className="text-[13px] font-bold text-white">{toast}</span>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
