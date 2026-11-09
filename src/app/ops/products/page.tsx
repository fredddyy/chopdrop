"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Types ── */
interface Vendor {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  retailPrice: number;
  groupPrice: number;
  minPoolSize: number;
  maxQuantity: number;
  isActive: boolean;
  tags: string | null;
  sortOrder: number;
  vendor: Vendor;
}

interface FormState {
  name: string;
  description: string;
  vendorId: string;
  retailPrice: string;
  groupPrice: string;
  minPoolSize: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  vendorId: "",
  retailPrice: "",
  groupPrice: "",
  minPoolSize: "10",
  imageUrl: "",
  category: "Food",
  isActive: true,
};

const CATEGORIES = ["Food", "Electronics", "Fashion", "Groceries", "Home"];

function koboToNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG");
}

function savingsPercent(retail: number, group: number): number {
  if (retail <= 0) return 0;
  return Math.round(((retail - group) / retail) * 100);
}

/* ── Page ── */
export default function ProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, vRes] = await Promise.all([
        fetch("/api/admin/products").then((r) => r.json()),
        fetch("/api/admin/restaurants").then((r) => r.json()),
      ]);
      if (pRes.success) setProducts(pRes.data);
      if (vRes.success) {
        setVendors(
          vRes.data.map((r: { id: string; name: string; imageUrl: string | null }) => ({
            id: r.id,
            name: r.name,
            imageUrl: r.imageUrl,
          }))
        );
      }
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

  function openEdit(p: ProductData) {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      vendorId: p.vendor.id,
      retailPrice: String(p.retailPrice / 100),
      groupPrice: String(p.groupPrice / 100),
      minPoolSize: String(p.minPoolSize),
      imageUrl: p.imageUrl || "",
      category: p.category,
      isActive: p.isActive,
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        vendorId: form.vendorId,
        retailPrice: Number(form.retailPrice),
        groupPrice: Number(form.groupPrice),
        minPoolSize: Number(form.minPoolSize),
        imageUrl: form.imageUrl || null,
        category: form.category,
        isActive: form.isActive,
      };

      if (editId) {
        await fetch(`/api/admin/products/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/products", {
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
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleActive(p: ProductData) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-[#1C1C1E]"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Products
        </h1>
        <button
          onClick={openAdd}
          className="h-[42px] px-5 rounded-xl bg-[#E84C3D] text-white text-sm font-semibold transition-colors hover:bg-[#DC2626]"
        >
          Add product
        </button>
      </div>

      {/* Product list */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6B7280] text-sm">No products yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[40px_1fr_1fr_100px_100px_60px_60px_80px_80px] gap-3 px-4 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide border-b border-[#E5E7EB]">
            <span />
            <span>Name</span>
            <span>Vendor</span>
            <span className="text-right">Retail</span>
            <span className="text-right">Group</span>
            <span className="text-right">Save</span>
            <span className="text-right">Pool</span>
            <span className="text-center">Active</span>
            <span className="text-center">Actions</span>
          </div>

          {/* Rows */}
          {products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 md:grid-cols-[40px_1fr_1fr_100px_100px_60px_60px_80px_80px] gap-3 px-4 py-3 border-b border-[#E5E7EB] last:border-b-0 items-center hover:bg-[#F8F8F6] transition-colors"
            >
              {/* Image */}
              <div className="hidden md:block">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[11px] font-bold text-[#9CA3AF]">
                    {p.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1C1C1E] truncate">
                  {p.name}
                </p>
                <p className="text-[11px] text-[#6B7280] md:hidden">
                  {p.vendor.name}
                </p>
              </div>

              {/* Vendor */}
              <p className="hidden md:block text-sm text-[#6B7280] truncate">
                {p.vendor.name}
              </p>

              {/* Retail price */}
              <p className="hidden md:block text-sm font-semibold text-[#1C1C1E] text-right tabular-nums">
                {"\u20A6"}{koboToNaira(p.retailPrice)}
              </p>

              {/* Group price */}
              <p className="hidden md:block text-sm font-semibold text-[#1A7D4B] text-right tabular-nums">
                {"\u20A6"}{koboToNaira(p.groupPrice)}
              </p>

              {/* Savings */}
              <p className="hidden md:block text-sm font-bold text-[#E84C3D] text-right tabular-nums">
                {savingsPercent(p.retailPrice, p.groupPrice)}%
              </p>

              {/* Min pool */}
              <p className="hidden md:block text-sm text-[#6B7280] text-right tabular-nums">
                {p.minPoolSize}
              </p>

              {/* Active toggle */}
              <div className="hidden md:flex justify-center">
                <button
                  onClick={() => toggleActive(p)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    p.isActive ? "bg-[#1A7D4B]" : "bg-[#D1D5DB]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      p.isActive ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-center md:justify-center">
                <button
                  onClick={() => openEdit(p)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-[#6B7280] bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] rounded-lg hover:bg-[#FECACA] transition-colors"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg mx-4 bg-white rounded-2xl border border-[#E5E7EB] max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2
                className="text-lg font-bold text-[#1C1C1E]"
                style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
              >
                {editId ? "Edit Product" : "Add Product"}
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
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                  placeholder="Product name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D] resize-none"
                  placeholder="Short description"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Vendor</label>
                <select
                  value={form.vendorId}
                  onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D] bg-white"
                >
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prices row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1">Retail price (Naira)</label>
                  <input
                    type="number"
                    value={form.retailPrice}
                    onChange={(e) => setForm({ ...form, retailPrice: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1">Group price (Naira)</label>
                  <input
                    type="number"
                    value={form.groupPrice}
                    onChange={(e) => setForm({ ...form, groupPrice: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Pool size + Category row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1">Min pool size</label>
                  <input
                    type="number"
                    value={form.minPoolSize}
                    onChange={(e) => setForm({ ...form, minPoolSize: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D]"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E84C3D]/30 focus:border-[#E84C3D] bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image upload */}
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
                      fd.append("folder", "chopdrop/products");
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

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    form.isActive ? "bg-[#1A7D4B]" : "bg-[#D1D5DB]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      form.isActive ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
                <span className="text-sm text-[#1C1C1E]">
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="h-[42px] px-5 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.vendorId || !form.retailPrice || !form.groupPrice}
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
