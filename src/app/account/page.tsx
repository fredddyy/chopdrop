"use client";

import { useState, useEffect } from "react";
import { getCustomerProfile, saveCustomerProfile, clearCustomerProfile, type CustomerProfile } from "@/lib/customer";
import { formatNaira } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountPage() {
  const [profile, setProfile] = useState<CustomerProfile>({
    name: "", phone: "", email: "", deliveryAddress: "",
    preferredFulfillment: "PICKUP", collectionPoint: "", reminders: true,
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingOffice, setEditingOffice] = useState(false);
  const [officeCodeInput, setOfficeCodeInput] = useState("");
  const [officeCodeError, setOfficeCodeError] = useState("");
  const [officeCodeLoading, setOfficeCodeLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orderStats, setOrderStats] = useState({ count: 0, totalSpent: 0 });
  const router = useRouter();

  useEffect(() => {
    const p = getCustomerProfile();
    if (p) setProfile({ collectionPoint: "", reminders: true, ...p });

    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.success && d.data) {
        const u = d.data;
        const serverProfile = {
          name: `${u.firstName} ${u.lastName || ""}`.trim(),
          phone: u.phone || "", email: u.email || "",
          deliveryAddress: p?.deliveryAddress || "",
          preferredFulfillment: p?.preferredFulfillment || "PICKUP",
          collectionPoint: u.office?.collectionPoint || p?.collectionPoint || "",
          reminders: p?.reminders ?? true,
          officeId: u.office?.id, officeName: u.office?.name, officeCode: u.office?.code,
        };
        setProfile(serverProfile);
        saveCustomerProfile(serverProfile);

        // Fetch order stats
        fetch("/api/orders/mine").then((r) => r.json()).then((od) => {
          if (od.success && od.data) {
            setOrderStats({
              count: od.data.length,
              totalSpent: od.data.reduce((s: number, o: { totalAmount: number }) => s + o.totalAmount, 0),
            });
          }
        }).catch(() => {});
      }
    }).catch(() => {});
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
        const lookupRes = await fetch(`/api/offices/lookup?code=${encodeURIComponent(officeCodeInput.trim().toUpperCase())}`);
        const lookupData = await lookupRes.json();
        if (lookupData.success) { save({ officeId: lookupData.data.id, officeName: lookupData.data.name, officeCode: lookupData.data.code, collectionPoint: lookupData.data.collectionPoint }); setOfficeCodeInput(""); setEditingOffice(false); }
        else { setOfficeCodeError(lookupData.error || "Office not found"); }
        setOfficeCodeLoading(false); return;
      }
      const data = await res.json();
      if (data.success) { save({ officeId: data.data.id, officeName: data.data.name, officeCode: data.data.code, collectionPoint: data.data.collectionPoint }); setOfficeCodeInput(""); setEditingOffice(false); }
      else { setOfficeCodeError(data.error || "Office not found"); }
    } catch { setOfficeCodeError("Connection error"); }
    setOfficeCodeLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearCustomerProfile();
    localStorage.removeItem("chopdrop-cart");
    localStorage.removeItem("chopdrop-banner-dismissed");
    router.push("/");
  }

  const initials = profile.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const firstName = profile.name.split(" ")[0] || "there";

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full pb-24" style={{ background: "var(--bg)" }}>

      {/* Profile header — dark, bold */}
      <div className="px-5 pt-8 pb-6" style={{ background: "var(--dark)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-extrabold text-white shrink-0" style={{ background: "var(--coral)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-extrabold text-white tracking-[-0.02em]">{firstName}</h1>
            <p className="text-[14px] text-white/50 mt-0.5">{profile.phone || "No phone set"}</p>
          </div>
          <button type="button" onClick={() => setEditingProfile(!editingProfile)} className="h-9 px-4 rounded-full text-[13px] font-bold cursor-pointer" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
            {editingProfile ? "Done" : "Edit"}
          </button>
        </div>

        {/* Edit form */}
        {editingProfile && (
          <div className="mt-5 space-y-3">
            <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className="w-full px-4 h-12 rounded-[12px] text-[15px] text-white placeholder:text-white/30 focus:outline-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone number" className="w-full px-4 h-12 rounded-[12px] text-[15px] text-white placeholder:text-white/30 focus:outline-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <button type="button" onClick={() => save(profile)} className="w-full h-11 rounded-full text-[14px] font-bold text-white cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "var(--coral)" }}>
              Save changes
            </button>
          </div>
        )}

        {/* Order stats — only if they've ordered */}
        {orderStats.count > 0 && !editingProfile && (
          <div className="flex gap-4 mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <div className="text-[22px] font-extrabold text-white tabular-nums">{orderStats.count}</div>
              <div className="text-[12px] text-white/40">orders</div>
            </div>
            <div>
              <div className="text-[22px] font-extrabold text-white tabular-nums">{formatNaira(orderStats.totalSpent)}</div>
              <div className="text-[12px] text-white/40">total spent</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 space-y-4 mt-5">

        {/* Office connection */}
        <section className="rounded-[20px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {profile.officeName ? (
            /* Connected state — clean confirmation */
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M4 21V4h11v17M15 9h5v12" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[16px] font-extrabold" style={{ color: "var(--text)" }}>{profile.officeName}</h2>
                  <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Pickup at {profile.collectionPoint || "reception"}</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(13,159,95,0.1)", color: "var(--emerald)" }}>Connected</span>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-[13px] font-mono font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>{profile.officeCode}</span>
                <button type="button"
                  onClick={async () => {
                    if (confirm("Disconnect from this office?")) {
                      await fetch("/api/auth/disconnect-office", { method: "POST" });
                      save({ officeId: undefined, officeName: undefined, officeCode: undefined, collectionPoint: "" });
                    }
                  }}
                  className="text-[13px] font-semibold cursor-pointer" style={{ color: "var(--coral)" }}>
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            /* Not connected — join form */
            <div className="p-4">
              <h2 className="text-[16px] font-extrabold mb-1" style={{ color: "var(--text)" }}>Connect your office</h2>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>Get free delivery on every order</p>
              {editingOffice ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={officeCodeInput} onChange={(e) => setOfficeCodeInput(e.target.value)} placeholder="Office code e.g. STERL-001" className="flex-1 px-4 h-11 rounded-[10px] text-[14px] uppercase focus:outline-none" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }} onKeyDown={(e) => e.key === "Enter" && handleConnectOffice()} />
                    <button type="button" onClick={handleConnectOffice} disabled={officeCodeLoading} className="h-11 px-5 rounded-[10px] text-[14px] font-bold text-white disabled:opacity-50 cursor-pointer" style={{ background: "var(--dark)" }}>{officeCodeLoading ? "..." : "Join"}</button>
                  </div>
                  {officeCodeError && <p className="text-[12px]" style={{ color: "var(--coral)" }}>{officeCodeError}</p>}
                  <button type="button" onClick={() => setEditingOffice(false)} className="text-[13px] font-semibold cursor-pointer" style={{ color: "var(--text-muted)" }}>Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setEditingOffice(true)} className="w-full h-11 rounded-full text-[14px] font-bold cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "var(--sand)", color: "var(--text)", border: "1px solid var(--border)" }}>
                  Enter office code
                </button>
              )}
            </div>
          )}
        </section>

        {/* Invite colleagues — viral growth */}
        {profile.officeName && profile.officeCode && (
          <section className="rounded-[20px] p-4" style={{ background: "var(--dark)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--gold)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white">Invite colleagues</h3>
                <p className="text-[13px] text-white/50">More people = cheaper food for everyone</p>
              </div>
            </div>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Join our office lunch pool on ChopDrop! Free delivery, pool pricing.\n\nUse code: ${profile.officeCode}\n\n${typeof window !== "undefined" ? window.location.origin : ""}/join/${profile.officeName?.toLowerCase().replace(/\s+/g, "-")}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full h-11 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 text-white cursor-pointer active:scale-[0.97] transition-transform" style={{ background: "#25d366" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Share on WhatsApp
            </a>
          </section>
        )}

        {/* Settings */}
        <section className="rounded-[20px] overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {/* Order reminder */}
          <button type="button" onClick={() => save({ reminders: !profile.reminders })} className="w-full flex items-center gap-3 p-4 text-left cursor-pointer" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
            </div>
            <div className="flex-1">
              <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Order reminder</span>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{profile.reminders ? "Daily at 9:45 AM" : "Off"}</p>
            </div>
            <div className="w-[42px] h-[26px] rounded-full flex items-center px-[3px] transition-colors duration-200 shrink-0" style={{ background: profile.reminders ? "var(--emerald)" : "var(--border)", justifyContent: profile.reminders ? "flex-end" : "flex-start" }}>
              <div className="w-5 h-5 bg-white rounded-full transition-transform" />
            </div>
          </button>

          {/* Order history */}
          <Link href="/orders" className="flex items-center gap-3 p-4 cursor-pointer" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <span className="text-[15px] font-semibold flex-1" style={{ color: "var(--text)" }}>Order history</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
          </Link>

          {/* Help */}
          <a href="https://wa.me/2349120532827?text=Hi%20ChopDrop!%20I%20need%20help" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 cursor-pointer">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--sand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </div>
            <span className="text-[15px] font-semibold flex-1" style={{ color: "var(--text)" }}>Help & support</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
          </a>
        </section>

        {/* Log out */}
        <button type="button" onClick={handleLogout} className="w-full h-12 rounded-[20px] text-[15px] font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-transform" style={{ color: "var(--coral)", background: "var(--card)", border: "1px solid var(--border)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          Log out
        </button>

        <div className="text-center pt-2 pb-4">
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>ChopDrop v1.0 · Made in Lagos</p>
        </div>
      </div>

      {/* Toast */}
      {saved && (
        <div className="fixed z-[100] left-1/2 bottom-24 -translate-x-1/2 rounded-full pl-3 pr-4 py-2.5 flex items-center gap-2 text-[13px] font-semibold text-white" style={{ background: "var(--dark)", animation: "toastIn 0.3s ease" }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--emerald)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          Saved
        </div>
      )}

      <BottomNav />
    </main>
  );
}
