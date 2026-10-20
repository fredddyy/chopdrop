"use client";

import { useState, useEffect } from "react";
import { getCustomerProfile, saveCustomerProfile, clearCustomerProfile, type CustomerProfile } from "@/lib/customer";
import { BottomNav } from "@/components/bottom-nav";
import { useRouter } from "next/navigation";

function ChopDropperInfo({ officeId, officeCode }: { officeId?: string; officeCode?: string }) {
  const [info, setInfo] = useState<{ name: string; phone: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const param = officeId ? `id=${encodeURIComponent(officeId)}` : `code=${encodeURIComponent(officeCode || "")}`;
    fetch(`/api/offices/lookup?${param}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.assistantName) {
          setInfo({ name: d.data.assistantName, phone: d.data.assistantPhone || "" });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [officeId]);

  if (!loaded) return null;

  return (
    <div className="px-4 py-3 border-b border-[#f0efeb]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#f05f4b]/10 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#f05f4b]">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-[#9ca3af] block">Your ChopDropper</span>
          {info ? (
            <span className="text-[13px] font-medium text-[#1a1a1a]">{info.name}</span>
          ) : (
            <span className="text-[12px] text-[#9ca3af]">Not assigned yet</span>
          )}
        </div>
        {info?.phone ? (
          <a
            href={`tel:${info.phone}`}
            className="text-[10px] font-semibold text-[#0f4030] bg-[#0f4030]/[0.06] px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            Call
          </a>
        ) : (
          <a
            href="https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20need%20a%20ChopDropper%20for%20my%20office"
            className="text-[10px] font-semibold text-[#f05f4b]"
          >
            Request
          </a>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [profile, setProfile] = useState<CustomerProfile>({
    name: "", phone: "", email: "", deliveryAddress: "",
    preferredFulfillment: "PICKUP", collectionPoint: "", reminders: true,
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingOffice, setEditingOffice] = useState(false);
  const [editingCollection, setEditingCollection] = useState(false);
  const [officeCodeInput, setOfficeCodeInput] = useState("");
  const [officeCodeError, setOfficeCodeError] = useState("");
  const [officeCodeLoading, setOfficeCodeLoading] = useState(false);
  const [collectionInput, setCollectionInput] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load from localStorage first
    const p = getCustomerProfile();
    if (p) setProfile({ collectionPoint: "", reminders: true, ...p });

    // Then sync from server (source of truth)
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const u = d.data;
          const serverProfile = {
            name: `${u.firstName} ${u.lastName || ""}`.trim(),
            phone: u.phone || "",
            email: u.email || "",
            deliveryAddress: p?.deliveryAddress || "",
            preferredFulfillment: p?.preferredFulfillment || "PICKUP",
            collectionPoint: u.office?.collectionPoint || p?.collectionPoint || "",
            reminders: p?.reminders ?? true,
            officeId: u.office?.id,
            officeName: u.office?.name,
            officeCode: u.office?.code,
          };
          setProfile(serverProfile);
          saveCustomerProfile(serverProfile);
        }
      })
      .catch(() => {});
  }, []);

  function save(updates: Partial<CustomerProfile>) {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    saveCustomerProfile(updated);
    setEditingProfile(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleConnectOffice() {
    if (!officeCodeInput.trim()) return;
    setOfficeCodeLoading(true); setOfficeCodeError("");
    try {
      const res = await fetch("/api/auth/connect-office", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: officeCodeInput.trim() }) });
      if (res.status === 401) {
        // Not authenticated — try the public lookup instead
        const lookupRes = await fetch(`/api/offices/lookup?code=${encodeURIComponent(officeCodeInput.trim().toUpperCase())}`);
        const lookupData = await lookupRes.json();
        if (lookupData.success) {
          save({ officeId: lookupData.data.id, officeName: lookupData.data.name, officeCode: lookupData.data.code, collectionPoint: lookupData.data.collectionPoint });
          setOfficeCodeInput("");
          setEditingOffice(false);
        } else {
          setOfficeCodeError(lookupData.error || "Office not found");
        }
        setOfficeCodeLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        save({ officeId: data.data.id, officeName: data.data.name, officeCode: data.data.code, collectionPoint: data.data.collectionPoint });
        setOfficeCodeInput("");
        setEditingOffice(false);
      } else { setOfficeCodeError(data.error || "Office not found"); }
    } catch (e) { setOfficeCodeError("Connection error. Check your internet and try again."); }
    setOfficeCodeLoading(false);
  }

  function saveCollectionPoint() {
    if (!collectionInput.trim()) return;
    save({ collectionPoint: collectionInput.trim() });
    setEditingCollection(false);
    setCollectionInput("");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearCustomerProfile();
    localStorage.removeItem("chopdrop-cart");
    localStorage.removeItem("chopdrop-banner-dismissed");
    router.push("/menu");
  }

  const initials = profile.name
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const hasProfile = profile.name.trim().length > 0;

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24 bg-[#fafaf8]">
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <h1 className="font-display font-bold text-[22px] text-[#1a1a1a] tracking-[-0.03em]">Account</h1>
      </div>

      <div className="px-5 space-y-3">
        {/* ── Profile card ── */}
        <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f05f4b] to-[#f5c565] flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              {hasProfile ? (
                <>
                  <h2 className="font-semibold text-[15px] text-[#1a1a1a] leading-tight">{profile.name}</h2>
                  <p className="text-[11px] text-[#9ca3af] mt-0.5">{profile.email || profile.phone}</p>
                </>
              ) : (
                <>
                  <h2 className="font-semibold text-[15px] text-[#1a1a1a]">No profile yet</h2>
                  <p className="text-[11px] text-[#9ca3af]">Add your details below</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEditingProfile(!editingProfile)}
              className="text-[11px] font-semibold text-[#0f4030] bg-[#0f4030]/[0.06] px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
            >
              {editingProfile ? "Done" : "Edit"}
            </button>
          </div>

          {editingProfile && (
            <div className="mt-4 pt-3 border-t border-[#f0efeb] space-y-2.5">
              <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30" />
              <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone number" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30" />
              <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="Email address" className="w-full px-3 py-2.5 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30" />
              <button type="button" onClick={() => save(profile)} className="w-full bg-[#1a1a1a] text-white font-semibold py-2.5 rounded-lg text-[12px] active:scale-[0.98] transition-transform">
                Save changes
              </button>
            </div>
          )}
        </section>

        {/* ── Office & delivery ── */}
        <section className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-4 pt-3.5 pb-1">
            <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.06em]">Office & delivery</h3>
          </div>

          {/* Office */}
          <button type="button" onClick={() => { if (!profile.officeName) { setEditingOffice(!editingOffice); setOfficeCodeError(""); } }} className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#f0efeb] text-left">
            <div className="w-9 h-9 rounded-xl bg-[#0f4030]/[0.06] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f4030]">
                <path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#9ca3af] block">Office</span>
              <span className="text-[13px] font-medium text-[#1a1a1a]">{profile.officeName || "Not connected"}</span>
            </div>
            {profile.officeName ? (
              <span className="text-[9px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-md">Connected</span>
            ) : (
              <span className="text-[10px] font-semibold text-[#0f4030]">{editingOffice ? "Cancel" : "Connect"}</span>
            )}
          </button>
          {/* Connected — show disconnect option */}
          {profile.officeName && (
            <div className="px-4 py-2.5 border-b border-[#f0efeb] flex items-center justify-between">
              <div className="text-[10px] text-[#9ca3af]">
                {profile.officeCode && <span className="font-mono font-bold text-[#1a1a1a] mr-1.5">{profile.officeCode}</span>}
                {profile.collectionPoint && <span>· {profile.collectionPoint}</span>}
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Disconnect from this office? You'll need a code to reconnect for free delivery.")) {
                    await fetch("/api/auth/disconnect-office", { method: "POST" });
                    save({ officeId: undefined, officeName: undefined, officeCode: undefined, collectionPoint: "" });
                    setEditingOffice(false);
                  }
                }}
                className="text-[10px] font-semibold text-[#f05f4b]"
              >
                Disconnect
              </button>
            </div>
          )}
          {/* ChopDropper info — show when connected */}
          {profile.officeName && (profile.officeId || profile.officeCode) && (
            <ChopDropperInfo officeId={profile.officeId} officeCode={profile.officeCode} />
          )}

          {/* Not connected — show connect form */}
          {editingOffice && !profile.officeName && (
            <div className="px-4 py-3 border-b border-[#f0efeb] space-y-2">
              <p className="text-[10px] text-[#9ca3af]">Enter your office code to connect. Ask your office assistant if you don&apos;t have one.</p>
              <div className="flex gap-2">
                <input type="text" value={officeCodeInput} onChange={(e) => setOfficeCodeInput(e.target.value)} placeholder="e.g. NORTH-241" className="flex-1 px-3 py-2 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30 uppercase" onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} />
                <button type="button" onClick={handleConnectOffice} disabled={officeCodeLoading} className="bg-[#0f4030] text-white font-bold px-4 py-2 rounded-lg text-[11px] disabled:opacity-50 active:scale-95 transition-transform">{officeCodeLoading ? "..." : "Join"}</button>
              </div>
              {officeCodeError && <p className="text-[#f05f4b] text-[10px]">{officeCodeError}</p>}
            </div>
          )}

          {/* Collection point */}
          <button type="button" onClick={() => { setEditingCollection(!editingCollection); setCollectionInput(profile.collectionPoint || ""); }} className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#f0efeb] text-left">
            <div className="w-9 h-9 rounded-xl bg-[#0f4030]/[0.06] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f4030]">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#9ca3af] block">Collection point</span>
              <span className="text-[13px] font-medium text-[#1a1a1a]">{profile.collectionPoint || "Not set"}</span>
            </div>
            <span className="text-[10px] font-semibold text-[#0f4030]">{editingCollection ? "Cancel" : "Edit"}</span>
          </button>
          {editingCollection && (
            <div className="px-4 py-3 border-b border-[#f0efeb]">
              <div className="flex gap-2">
                <input type="text" value={collectionInput} onChange={(e) => setCollectionInput(e.target.value)} placeholder="e.g. Main reception desk" className="flex-1 px-3 py-2 bg-[#f5f5f3] rounded-lg text-[12px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0f4030]/30" onKeyDown={(e) => e.key === "Enter" && saveCollectionPoint()} />
                <button type="button" onClick={saveCollectionPoint} className="bg-[#0f4030] text-white font-bold px-4 py-2 rounded-lg text-[11px] active:scale-95 transition-transform">Save</button>
              </div>
            </div>
          )}

          {/* Office code */}
          {profile.officeCode && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-[#0f4030]/[0.06] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f4030]">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#9ca3af] block">Office code</span>
                <span className="text-[13px] font-mono font-bold text-[#1a1a1a]">{profile.officeCode}</span>
              </div>
            </div>
          )}
        </section>

        {/* ── Preferences ── */}
        <section className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-4 pt-3.5 pb-1">
            <h3 className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.06em]">Preferences</h3>
          </div>

          {/* Reminders */}
          <button
            type="button"
            onClick={() => save({ reminders: !profile.reminders })}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#f0efeb] text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0f4030]/[0.06] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f4030]">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#9ca3af] block">Drop reminders</span>
              <span className="text-[13px] font-medium text-[#1a1a1a]">{profile.reminders ? "On · 9:45 AM daily" : "Off"}</span>
            </div>
            <div className={`w-[38px] h-[22px] rounded-full flex items-center px-[2px] transition-colors duration-200 ${profile.reminders ? "bg-[#22c55e] justify-end" : "bg-[#d1d5db] justify-start"}`}>
              <div className="w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform" />
            </div>
          </button>

          {/* Payment method */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f4030]/[0.06] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f4030]">
                <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#9ca3af] block">Payment</span>
              <span className="text-[13px] font-medium text-[#1a1a1a]">Paystack secure checkout</span>
            </div>
            <span className="text-[9px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-md">Secure</span>
          </div>
        </section>

        {/* ── Danger zone ── */}
        <section className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#f05f4b]/[0.08] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#f05f4b]">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-[#f05f4b]">Log out</span>
          </button>
        </section>
      </div>

      {/* Toast */}
      {saved && (
        <div className="fixed z-[100] left-1/2 bottom-24 -translate-x-1/2 bg-[#1a1a1a] text-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.25)] pl-3 pr-4 py-2.5 flex items-center gap-2 text-[12px] font-semibold" style={{ animation: "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div className="w-5 h-5 bg-[#6ee7b7] rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f4030]"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          Saved
        </div>
      )}

      <style jsx global>{`
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 12px) scale(0.95); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
      `}</style>

      <BottomNav />
    </main>
  );
}
