"use client";

import { useState, useEffect } from "react";

function fp(kobo: number): string { return "\u20A6" + (kobo / 100).toLocaleString(); }

interface Product { id: string; name: string; retailPrice: number; groupPrice: number; imageUrl: string | null; vendor: { name: string } }
interface FlashDeal { id: string; productName: string; productImage: string | null; retailPrice: number; groupPrice: number; flashPrice: number | null; minSize: number; memberCount: number; status: string; deadline: string; createdAt: string }

export default function FlashDealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [flashPrice, setFlashPrice] = useState("");
  const [duration, setDuration] = useState(60);
  const [minSize, setMinSize] = useState(5);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=50").then(r => r.json()).then(d => { if (d.success) setProducts(d.data); });
    fetch("/api/admin/flash-deals").then(r => r.json()).then(d => { if (d.success) setDeals(d.data); });
  }, []);

  async function handleCreate() {
    if (!selectedProduct || !flashPrice) return;
    setCreating(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/flash-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          flashPrice: Math.round(parseFloat(flashPrice) * 100),
          durationMinutes: duration,
          minSize,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setMessage("Flash deal launched!");
        setSelectedProduct(""); setFlashPrice("");
        fetch("/api/admin/flash-deals").then(r => r.json()).then(d => { if (d.success) setDeals(d.data); });
      } else {
        setMessage(d.error || "Failed");
      }
    } catch { setMessage("Network error"); }
    setCreating(false);
  }

  const activeDeals = deals.filter(d => d.status === "OPEN" && new Date(d.deadline) > new Date());
  const pastDeals = deals.filter(d => d.status !== "OPEN" || new Date(d.deadline) <= new Date());

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#1C1C1E" }}>Flash Deals</h1>
      <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>Create time-limited deals with aggressive discounts. Pinned to top of discover.</p>

      {/* Create form */}
      <div className="rounded-xl p-5 mb-8" style={{ background: "#1C1C1E" }}>
        <h2 className="text-lg font-bold text-white mb-4">Launch a Flash Deal</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-400 block mb-1">Product</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/10 text-white text-sm border border-white/10 outline-none">
              <option value="">Select product...</option>
              {products.filter(p => p.groupPrice < p.retailPrice).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({fp(p.retailPrice)} retail, {fp(p.groupPrice)} group)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Flash Price (Naira)</label>
            <input type="number" value={flashPrice} onChange={e => setFlashPrice(e.target.value)}
              placeholder="e.g. 800" className="w-full h-10 px-3 rounded-lg bg-white/10 text-white text-sm border border-white/10 outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Duration</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-lg bg-white/10 text-white text-sm border border-white/10 outline-none">
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Min Buyers</label>
            <input type="number" value={minSize} onChange={e => setMinSize(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-lg bg-white/10 text-white text-sm border border-white/10 outline-none" />
          </div>
        </div>
        {message && <p className="text-sm mb-3" style={{ color: message.includes("error") || message.includes("Failed") ? "#E84C3D" : "#22C55E" }}>{message}</p>}
        <button onClick={handleCreate} disabled={creating || !selectedProduct || !flashPrice}
          className="h-10 px-6 rounded-lg text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "#E84C3D" }}>
          {creating ? "Launching..." : "Launch Flash Deal"}
        </button>
      </div>

      {/* Active deals */}
      {activeDeals.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#E84C3D" }}>Active ({activeDeals.length})</h3>
          <div className="space-y-2">
            {activeDeals.map(d => {
              const minsLeft = Math.max(0, Math.round((new Date(d.deadline).getTime() - Date.now()) / 60000));
              return (
                <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "white", border: "1px solid #E5E7EB" }}>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: "#1C1C1E" }}>{d.productName}</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{fp(d.flashPrice || 0)} flash · {fp(d.retailPrice)} retail · {d.memberCount}/{d.minSize} joined</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#E84C3D" }}>{minsLeft}m left</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past deals */}
      {pastDeals.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Past</h3>
          <div className="space-y-2">
            {pastDeals.map(d => (
              <div key={d.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#6B7280" }}>{d.productName}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{d.memberCount}/{d.minSize} joined · {d.status}</p>
                </div>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
