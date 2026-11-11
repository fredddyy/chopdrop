"use client";

import { useState, useEffect, useCallback } from "react";

interface RestaurantData {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl: string | null;
  isActive: boolean;
  groupTiers?: Array<{ min: number; discount: number }>;
}

interface FormState {
  name: string;
  address: string;
  phone: string;
  imageUrl: string;
  groupTiers: Array<{ min: number; discount: number }>;
}

const EMPTY_FORM: FormState = {
  name: "",
  address: "",
  phone: "",
  imageUrl: "",
  groupTiers: [],
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/restaurants");
      const json = await res.json();
      if (json.success) setRestaurants(json.data);
    } catch {
      /* network error */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(r: RestaurantData) {
    setEditId(r.id);
    setForm({
      name: r.name,
      address: r.address,
      phone: r.phone,
      imageUrl: r.imageUrl || "",
      groupTiers: Array.isArray(r.groupTiers) ? r.groupTiers : [],
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const validTiers = form.groupTiers.filter(t => t.min > 0 && t.discount > 0).sort((a, b) => a.min - b.min);
      const payload = {
        name: form.name,
        address: form.address,
        phone: form.phone,
        imageUrl: form.imageUrl || null,
        groupTiers: validTiers.length > 0 ? validTiers : null,
      };

      if (editId) {
        await fetch(`/api/admin/restaurants/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/restaurants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      await load();
    } catch {
      /* save failed */
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this restaurant?")) return;
    await fetch(`/api/admin/restaurants/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleActive(r: RestaurantData) {
    await fetch(`/api/admin/restaurants/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#E84C3D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-[#1C1C1E]"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Restaurants
        </h1>
        <button
          onClick={openAdd}
          className="h-[42px] px-5 rounded-xl bg-[#E84C3D] text-white text-sm font-semibold transition-colors hover:bg-[#DC2626]"
        >
          Add restaurant
        </button>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6B7280] text-sm">No restaurants yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="hidden md:grid grid-cols-[48px_1fr_1fr_140px_80px_80px] gap-3 px-4 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide border-b border-[#E5E7EB]">
            <span />
            <span>Name</span>
            <span>Address</span>
            <span>Phone</span>
            <span className="text-center">Active</span>
            <span className="text-center">Actions</span>
          </div>

          {restaurants.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-1 md:grid-cols-[48px_1fr_1fr_140px_80px_80px] gap-3 px-4 py-3 border-b border-[#E5E7EB] last:border-b-0 items-center hover:bg-[#F8F8F6] transition-colors"
            >
              <div className="hidden md:block">
                {r.imageUrl ? (
                  <img
                    src={r.imageUrl}
                    alt={r.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#FEF2F0] flex items-center justify-center text-[13px] font-bold text-[#E84C3D]">
                    {r.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1C1C1E] truncate">
                  {r.name}
                </p>
                <p className="text-[11px] text-[#6B7280] md:hidden truncate">
                  {r.address}
                </p>
              </div>

              <p className="hidden md:block text-sm text-[#6B7280] truncate">
                {r.address}
              </p>

              <p className="hidden md:block text-sm text-[#6B7280] tabular-nums">
                {r.phone}
              </p>

              <div className="hidden md:flex justify-center">
                <button
                  onClick={() => toggleActive(r)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    r.isActive ? "bg-[#1A7D4B]" : "bg-[#D1D5DB]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      r.isActive ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-1 justify-center">
                <button
                  onClick={() => openEdit(r)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-[#6B7280] bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] rounded-lg hover:bg-[#FECACA] transition-colors"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg mx-4 bg-white rounded-2xl border border-[#E5E7EB] max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2
                className="text-lg font-bold text-[#1C1C1E]"
                style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
              >
                {editId ? "Edit Restaurant" : "Add Restaurant"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#9CA3AF] hover:text-[#1C1C1E] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                  placeholder="Restaurant name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                  placeholder="08012345678"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Image</label>
                <div className="flex items-center gap-3">
                  {form.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <label className="h-10 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#1C1C1E] flex items-center gap-2 cursor-pointer hover:bg-[#F8F8F6]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("folder", "chopdrop/restaurants");
                      try {
                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                        const data = await res.json();
                        if (data.success) setForm({ ...form, imageUrl: data.url });
                      } catch {}
                    }} />
                  </label>
                </div>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full h-8 px-3 mt-2 rounded-lg border border-[#E5E7EB] text-xs text-[#9CA3AF] focus:outline-none"
                  placeholder="or paste URL..."
                />
              </div>
            </div>

            {/* Group Discount Tiers */}
            <div className="px-6 py-4 border-t border-[#E5E7EB]">
              <label className="block text-xs font-medium text-[#6B7280] mb-2">Group Order Discount Tiers</label>
              <p className="text-[11px] text-[#9CA3AF] mb-3">When X+ gang members order together, everyone gets Y% off. Discounts are settled after the order deadline.</p>
              {form.groupTiers.map((tier, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input type="number" min={1} value={tier.min} onChange={(e) => {
                    const updated = [...form.groupTiers];
                    updated[i] = { ...updated[i], min: parseInt(e.target.value) || 0 };
                    setForm({ ...form, groupTiers: updated });
                  }} className="w-20 h-9 px-2 rounded-lg border border-[#E5E7EB] text-sm text-center" placeholder="Min" />
                  <span className="text-xs text-[#9CA3AF]">people →</span>
                  <input type="number" min={1} max={99} value={tier.discount} onChange={(e) => {
                    const updated = [...form.groupTiers];
                    updated[i] = { ...updated[i], discount: parseInt(e.target.value) || 0 };
                    setForm({ ...form, groupTiers: updated });
                  }} className="w-20 h-9 px-2 rounded-lg border border-[#E5E7EB] text-sm text-center" placeholder="%" />
                  <span className="text-xs text-[#9CA3AF]">% off</span>
                  <button type="button" onClick={() => {
                    setForm({ ...form, groupTiers: form.groupTiers.filter((_, j) => j !== i) });
                  }} className="text-[#E84C3D] text-xs font-bold ml-auto">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => {
                setForm({ ...form, groupTiers: [...form.groupTiers, { min: form.groupTiers.length === 0 ? 3 : (form.groupTiers[form.groupTiers.length - 1]?.min || 3) + 2, discount: form.groupTiers.length === 0 ? 10 : (form.groupTiers[form.groupTiers.length - 1]?.discount || 10) + 10 }] });
              }} className="text-[13px] font-semibold text-[#E84C3D] mt-1">+ Add tier</button>
            </div>

            <div className="px-6 py-4 border-t border-[#E5E7EB] flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="h-[42px] px-5 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="h-[42px] px-5 rounded-xl bg-[#E84C3D] text-white text-sm font-semibold transition-colors hover:bg-[#DC2626] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
