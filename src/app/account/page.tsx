"use client";

import { useState, useEffect } from "react";
import { getCustomerProfile, saveCustomerProfile, clearCustomerProfile, type CustomerProfile } from "@/lib/customer";
import { BottomNav } from "@/components/bottom-nav";

type EditingField = null | "profile" | "office" | "collection" | "reminders";

export default function AccountPage() {
  const [profile, setProfile] = useState<CustomerProfile>({
    name: "", phone: "", email: "", deliveryAddress: "",
    preferredFulfillment: "PICKUP", collectionPoint: "", reminders: true,
  });
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [tempValue, setTempValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getCustomerProfile();
    if (p) setProfile({ collectionPoint: "", reminders: true, ...p });
  }, []);

  function save(updates: Partial<CustomerProfile>) {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    saveCustomerProfile(updated);
    setEditingField(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function startEdit(field: EditingField, currentValue: string) {
    setEditingField(field);
    setTempValue(currentValue);
  }

  const initials = profile.name
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const hasProfile = profile.name.trim().length > 0;

  const settings = [
    {
      key: "office" as const,
      icon: "M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3",
      label: "Office",
      value: profile.officeName || profile.deliveryAddress || "Not set",
      placeholder: "e.g. Northcourt · 8th floor, Alausa",
    },
    {
      key: "collection" as const,
      icon: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0ZM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
      label: "Collection point",
      value: profile.collectionPoint || "Not set",
      placeholder: "e.g. Main reception desk",
    },
    {
      key: "reminders" as const,
      icon: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
      label: "Lunch reminders",
      value: profile.reminders ? "On · 9:45 AM daily" : "Off",
      placeholder: "",
    },
  ];

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full pb-20">
      <div className="px-5 md:px-12 py-8">
        <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.13em]">Account</div>
        <h1 className="font-display font-bold text-[28px] tracking-[-0.04em] mt-1">Your lunch details</h1>
      </div>

      <div className="px-5 md:px-12 pb-10">
        <div className="bg-paper border border-line rounded-[16px] p-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 pb-5 border-b border-line">
            <div className="w-[56px] h-[56px] rounded-full bg-amber flex items-center justify-center text-ink font-extrabold text-[17px] flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              {hasProfile ? (
                <>
                  <div className="font-display font-bold text-[20px] tracking-[-0.025em]">{profile.name}</div>
                  <span className="text-ink-soft text-[12px]">{profile.email || profile.phone}</span>
                </>
              ) : (
                <>
                  <div className="font-display font-bold text-[20px]">No profile yet</div>
                  <span className="text-ink-soft text-[12px]">Add your details below</span>
                </>
              )}
            </div>
          </div>

          {/* Edit profile — inline expand */}
          {editingField === "profile" ? (
            <div className="pt-5 space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide block mb-1">Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Amaka Okoro" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide block mb-1">Phone</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="0803 456 7890" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide block mb-1">Email</label>
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="amaka@email.com" className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => save(profile)} className="flex-1 bg-coral text-white font-bold py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors">Save</button>
                <button type="button" onClick={() => setEditingField(null)} className="flex-1 bg-cream text-ink-soft font-bold py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setEditingField("profile")} className="w-full mt-4 py-2.5 border border-line rounded-[10px] text-sm font-bold text-ink hover:bg-cream transition-colors">
              Edit profile
            </button>
          )}

          {/* Settings list */}
          <div className="mt-5">
            {settings.map((item) => {
              const isEditing = editingField === item.key;

              return (
                <div key={item.key} className="border-b border-line last:border-b-0">
                  {/* Row — tappable */}
                  <button
                    type="button"
                    onClick={() => {
                      if (item.key === "reminders") {
                        save({ reminders: !profile.reminders });
                      } else {
                        startEdit(item.key, item.key === "office" ? (profile.officeName || profile.deliveryAddress || "") : (profile.collectionPoint || ""));
                      }
                    }}
                    className="w-full flex items-center gap-3.5 py-4 hover:bg-cream/50 -mx-5 px-5 transition-colors text-left"
                  >
                    <div className="w-[37px] h-[37px] rounded-[10px] bg-green-soft text-green flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <small className="text-ink-soft text-[10px] block">{item.label}</small>
                      <strong className="text-[13px] block mt-0.5">{item.value}</strong>
                    </div>
                    {item.key === "reminders" ? (
                      <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${profile.reminders ? "bg-green justify-end" : "bg-line justify-start"}`}>
                        <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                      </div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft flex-shrink-0">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    )}
                  </button>

                  {/* Inline editor */}
                  {isEditing && item.key !== "reminders" && (
                    <div className="pb-4 -mx-5 px-5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          placeholder={item.placeholder}
                          autoFocus
                          className="flex-1 px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30"
                        />
                        <button
                          type="button"
                          onClick={() => save(item.key === "office" ? { deliveryAddress: tempValue.trim(), officeName: tempValue.trim() } : { collectionPoint: tempValue.trim() })}
                          className="bg-coral text-white font-bold px-4 py-2.5 rounded-[10px] text-sm hover:bg-[#d95038] transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          className="bg-cream text-ink-soft font-bold px-3 py-2.5 rounded-[10px] text-sm hover:bg-line transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Payment — non-editable */}
            <div className="flex items-center gap-3.5 py-4 -mx-5 px-5">
              <div className="w-[37px] h-[37px] rounded-[10px] bg-green-soft text-green flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" />
                </svg>
              </div>
              <div className="flex-1">
                <small className="text-ink-soft text-[10px] block">Payment</small>
                <strong className="text-[13px] block mt-0.5">Paystack secure checkout</strong>
              </div>
              <span className="text-[9px] text-green font-bold bg-green-soft px-2 py-1 rounded-full">Secure</span>
            </div>
          </div>

          {/* Clear profile */}
          {hasProfile && (
            <button
              type="button"
              onClick={() => {
                clearCustomerProfile();
                setProfile({ name: "", phone: "", email: "", deliveryAddress: "", preferredFulfillment: "PICKUP", collectionPoint: "", reminders: true });
              }}
              className="w-full mt-4 py-2 text-coral text-xs font-semibold hover:underline"
            >
              Clear saved profile
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div className="fixed z-[100] left-1/2 bottom-20 -translate-x-1/2 bg-ink text-white rounded-[11px] shadow-[0_15px_35px_rgba(0,0,0,0.22)] px-4 py-3 flex items-center gap-2 text-xs font-bold animate-[toastIn_0.25s_ease]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
            <path d="m5 12 4 4L19 6" />
          </svg>
          Saved
        </div>
      )}

      <style jsx global>{`
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 10px); } }
      `}</style>

      <BottomNav />
    </main>
  );
}
