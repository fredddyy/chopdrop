"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";

interface SettingItem { key: string; value: string; }

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Editable fields with defaults
  const [poolTimer, setPoolTimer] = useState("25");
  const [serviceFee, setServiceFee] = useState("100");
  const [groupBuyEnabled, setGroupBuyEnabled] = useState(true);
  const [chopPriceEnabled, setChopPriceEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      if (d.success && d.data) {
        const list = Array.isArray(d.data) ? d.data : Object.entries(d.data).map(([key, value]) => ({ key, value: String(value) }));
        setSettings(list);
        for (const s of list) {
          if (s.key === "pool-default-timer-mins") setPoolTimer(s.value);
          if (s.key === "service-fee") setServiceFee(String(Math.round(Number(s.value) / 100)));
          if (s.key === "group-buy-enabled") setGroupBuyEnabled(s.value !== "false");
          if (s.key === "chop-price-enabled") setChopPriceEnabled(s.value !== "false");
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function saveSetting(key: string, value: string) {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).catch(() => {});
    setSaving(false);
    setToast(`Saved: ${key}`);
    setTimeout(() => setToast(""), 2000);
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Settings size={20} style={{ color: "#E84C3D" }} />
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Settings</h1>
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-[14px] p-4" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
              <div className="h-5 rounded w-[40%] mb-2" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div className="h-10 rounded w-[60%]" style={{ background: "#F8F8F6", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} style={{ color: "#E84C3D" }} />
        <h1 className="text-[22px] font-extrabold tracking-[-0.02em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>Settings</h1>
      </div>

      <div className="space-y-4">
        {/* Group Buy Settings */}
        <div className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <h3 className="text-[14px] font-bold mb-3" style={{ color: "#1C1C1E" }}>Group Buy</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#1C1C1E" }}>Pool Timer (minutes)</p>
                <p className="text-[10px]" style={{ color: "#9CA3AF" }}>How long users have to fill a group</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={poolTimer} onChange={e => setPoolTimer(e.target.value)}
                  className="w-[70px] h-[36px] px-3 rounded-[8px] text-[13px] font-bold text-center outline-none" style={{ background: "#F8F8F6", color: "#1C1C1E", border: "1px solid #E5E7EB" }} />
                <button onClick={() => saveSetting("pool-default-timer-mins", poolTimer)} disabled={saving}
                  className="h-[36px] px-3 rounded-[8px] text-[11px] font-bold text-white" style={{ background: "#E84C3D" }}>Save</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#1C1C1E" }}>Group Buying</p>
                <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Enable or disable group buying app-wide</p>
              </div>
              <button onClick={() => { const v = !groupBuyEnabled; setGroupBuyEnabled(v); saveSetting("group-buy-enabled", String(v)); }}
                className="w-[44px] h-[26px] rounded-full relative" style={{ background: groupBuyEnabled ? "#22C55E" : "#E5E7EB" }}>
                <div className="w-[22px] h-[22px] rounded-full bg-white absolute top-[2px]" style={{ left: groupBuyEnabled ? "20px" : "2px", transition: "left 200ms ease-out" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Price Chop */}
        <div className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <h3 className="text-[14px] font-bold mb-3" style={{ color: "#1C1C1E" }}>Price Chop</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#1C1C1E" }}>Chop Price Feature</p>
              <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Enable or disable Price Chop for all products</p>
            </div>
            <button onClick={() => { const v = !chopPriceEnabled; setChopPriceEnabled(v); saveSetting("chop-price-enabled", String(v)); }}
              className="w-[44px] h-[26px] rounded-full relative" style={{ background: chopPriceEnabled ? "#22C55E" : "#E5E7EB" }}>
              <div className="w-[22px] h-[22px] rounded-full bg-white absolute top-[2px]" style={{ left: chopPriceEnabled ? "20px" : "2px", transition: "left 200ms ease-out" }} />
            </button>
          </div>
        </div>

        {/* Fees */}
        <div className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <h3 className="text-[14px] font-bold mb-3" style={{ color: "#1C1C1E" }}>Fees</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#1C1C1E" }}>Service Fee (₦)</p>
              <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Flat fee added to each order</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={serviceFee} onChange={e => setServiceFee(e.target.value)}
                className="w-[70px] h-[36px] px-3 rounded-[8px] text-[13px] font-bold text-center outline-none" style={{ background: "#F8F8F6", color: "#1C1C1E", border: "1px solid #E5E7EB" }} />
              <button onClick={() => saveSetting("service-fee", String(Number(serviceFee) * 100))} disabled={saving}
                className="h-[36px] px-3 rounded-[8px] text-[11px] font-bold text-white" style={{ background: "#E84C3D" }}>Save</button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[10px] text-[12px] font-bold text-white" style={{ background: "#22C55E" }}>{toast}</div>
      )}
    </div>
  );
}
