"use client";

import { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import { Package, Search, Plus, ChevronDown, ChevronUp, X, Image as ImageIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  retailPrice: number; // kobo
  groupPrice: number; // kobo
  minPoolSize: number;
  category: string;
  subcategory: string | null;
  isActive: boolean;
  vendor: Vendor;
}

interface Store {
  id: string;
  name: string;
}

type FormData = {
  name: string;
  description: string;
  vendorId: string;
  category: string;
  retailPrice: string; // naira string for input
  groupPrice: string;
  minPoolSize: string;
  isActive: boolean;
};

const CATEGORIES = ["Food", "Groceries", "Gadgets", "Fashion", "Home"];

const EMPTY_FORM: FormData = {
  name: "",
  description: "",
  vendorId: "",
  category: "Food",
  retailPrice: "",
  groupPrice: "",
  minPoolSize: "10",
  isActive: true,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function koboToNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function savingsPercent(retail: number, group: number): number {
  if (retail <= 0) return 0;
  return Math.round(((retail - group) / retail) * 100);
}

/* ------------------------------------------------------------------ */
/*  Inline styles                                                      */
/* ------------------------------------------------------------------ */

const S = {
  page: {
    minHeight: "100vh",
    background: "#FAF9F7",
    padding: "24px 20px 80px",
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,

  heading: {
    fontFamily: "'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: "#2D2A26",
    margin: 0,
  } as React.CSSProperties,

  subtext: {
    fontSize: 13,
    color: "#6B6560",
    marginTop: 2,
  } as React.CSSProperties,

  card: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    overflow: "hidden" as const,
  } as React.CSSProperties,

  filterBar: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
    alignItems: "center",
    marginBottom: 20,
  } as React.CSSProperties,

  input: {
    height: 40,
    padding: "0 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    fontSize: 13,
    color: "#2D2A26",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
  } as React.CSSProperties,

  select: {
    height: 40,
    padding: "0 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    fontSize: 13,
    color: "#2D2A26",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
    cursor: "pointer",
    minWidth: 140,
  } as React.CSSProperties,

  btnPrimary: {
    height: 40,
    padding: "0 18px",
    background: "#E84C3D",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "inherit",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  btnSecondary: {
    height: 36,
    padding: "0 14px",
    background: "transparent",
    color: "#6B6560",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontFamily: "inherit",
  } as React.CSSProperties,

  togglePill: (active: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      border: "none",
      background: active ? "#E84C3D" : "#F0EBE4",
      color: active ? "#fff" : "#6B6560",
      fontFamily: "inherit",
    }) as React.CSSProperties,

  badge: (cat: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      Food: { bg: "#FEF3C7", color: "#92400E" },
      Groceries: { bg: "#D1FAE5", color: "#065F46" },
      Gadgets: { bg: "#DBEAFE", color: "#1E40AF" },
      Fashion: { bg: "#FCE7F3", color: "#9D174D" },
      Home: { bg: "#E0E7FF", color: "#3730A3" },
    };
    const c = map[cat] || { bg: "#F0EBE4", color: "#6B6560" };
    return {
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: c.bg,
      color: c.color,
      whiteSpace: "nowrap" as const,
    } as React.CSSProperties;
  },

  toggleSwitch: (on: boolean) =>
    ({
      width: 38,
      height: 22,
      borderRadius: 11,
      background: on ? "#1A7D4B" : "#D1D5DB",
      position: "relative" as const,
      cursor: "pointer",
      border: "none",
      transition: "background 0.2s",
      flexShrink: 0,
    }) as React.CSSProperties,

  toggleDot: (on: boolean) =>
    ({
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "#fff",
      position: "absolute" as const,
      top: 3,
      left: on ? 19 : 3,
      transition: "left 0.2s",
    }) as React.CSSProperties,

  skeletonRow: {
    height: 56,
    background: "linear-gradient(90deg, #F0EBE4 25%, #FAF9F7 50%, #F0EBE4 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: 8,
    marginBottom: 2,
  } as React.CSSProperties,

  thumb: (url: string | null) =>
    ({
      width: 40,
      height: 40,
      borderRadius: 10,
      objectFit: "cover" as const,
      background: "#F0EBE4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      overflow: "hidden",
      ...(url ? {} : {}),
    }) as React.CSSProperties,

  formCard: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  } as React.CSSProperties,

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  } as React.CSSProperties,

  formLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6B6560",
    marginBottom: 4,
    display: "block",
  } as React.CSSProperties,

  formInput: {
    width: "100%",
    height: 40,
    padding: "0 12px",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    fontSize: 13,
    color: "#2D2A26",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  savingsTag: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: "#D1FAE5",
    color: "#065F46",
  } as React.CSSProperties,

  mobileCard: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  } as React.CSSProperties,
};

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      style={{ ...S.toggleSwitch(on), opacity: disabled ? 0.5 : 1 }}
      onClick={() => !disabled && onChange(!on)}
      aria-label={on ? "Active" : "Inactive"}
    >
      <span style={S.toggleDot(on)} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Form (create / edit)                                       */
/* ------------------------------------------------------------------ */

function ProductForm({
  stores,
  initial,
  onSave,
  onCancel,
  saving,
}: {
  stores: Store[];
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormData>(initial);

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  const isEdit = initial.name !== "";

  return (
    <form onSubmit={handleSubmit} style={S.formCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2D2A26", margin: 0, fontFamily: "'Bricolage Grotesque', system-ui" }}>
          {isEdit ? "Edit Product" : "New Product"}
        </h3>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#9C9590", padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      <div style={S.formGrid}>
        {/* Name */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={S.formLabel}>Product Name</label>
          <input
            style={S.formInput}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Jollof Rice Party Pack"
            required
          />
        </div>

        {/* Description */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={S.formLabel}>Description</label>
          <textarea
            style={{ ...S.formInput, height: 70, padding: "10px 12px", resize: "vertical" as const }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description..."
          />
        </div>

        {/* Store */}
        <div>
          <label style={S.formLabel}>Store</label>
          <select
            style={{ ...S.formInput, cursor: "pointer" }}
            value={form.vendorId}
            onChange={(e) => set("vendorId", e.target.value)}
            required
          >
            <option value="">Select store...</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label style={S.formLabel}>Category</label>
          <select
            style={{ ...S.formInput, cursor: "pointer" }}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Retail Price */}
        <div>
          <label style={S.formLabel}>Retail Price (₦)</label>
          <input
            style={S.formInput}
            type="number"
            min="0"
            step="1"
            value={form.retailPrice}
            onChange={(e) => set("retailPrice", e.target.value)}
            placeholder="e.g. 5000"
            required
          />
        </div>

        {/* Group Price */}
        <div>
          <label style={S.formLabel}>Group Price (₦)</label>
          <input
            style={S.formInput}
            type="number"
            min="0"
            step="1"
            value={form.groupPrice}
            onChange={(e) => set("groupPrice", e.target.value)}
            placeholder="e.g. 3500"
            required
          />
        </div>

        {/* Min Pool Size */}
        <div>
          <label style={S.formLabel}>Min Pool Size</label>
          <input
            style={S.formInput}
            type="number"
            min="1"
            value={form.minPoolSize}
            onChange={(e) => set("minPoolSize", e.target.value)}
            placeholder="10"
          />
        </div>

        {/* Active toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 20 }}>
          <Toggle on={form.isActive} onChange={(v) => set("isActive", v)} />
          <span style={{ fontSize: 13, color: "#2D2A26", fontWeight: 500 }}>
            {form.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <button type="button" onClick={onCancel} style={S.btnSecondary}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loader                                                    */
/* ------------------------------------------------------------------ */

function Skeleton() {
  return (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={S.card}>
        <div style={{ padding: "12px 16px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={S.skeletonRow} />
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [storeFilter, setStoreFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  // Forms
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ---- Data fetching ---- */

  const loadData = useCallback(async () => {
    const [prodRes, storeRes] = await Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/restaurants").then((r) => r.json()),
    ]);
    if (prodRes.success) setProducts(prodRes.data);
    if (storeRes.success) {
      setStores(
        storeRes.data.map((s: { id: string; name: string }) => ({
          id: s.id,
          name: s.name,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---- Filtering ---- */

  const filtered = useMemo(() => {
    let list = products;
    if (storeFilter) list = list.filter((p) => p.vendor.id === storeFilter);
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    if (activeOnly) list = list.filter((p) => p.isActive);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.vendor.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, storeFilter, categoryFilter, searchText, activeOnly]);

  /* ---- Create ---- */

  async function handleCreate(form: FormData) {
    setSaving(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId: form.vendorId,
        name: form.name,
        description: form.description || null,
        category: form.category,
        retailPrice: Number(form.retailPrice),
        groupPrice: Number(form.groupPrice),
        minPoolSize: Number(form.minPoolSize) || 10,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreate(false);
      await loadData();
    }
    setSaving(false);
  }

  /* ---- Update ---- */

  async function handleUpdate(id: string, form: FormData) {
    setSaving(true);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        category: form.category,
        retailPrice: Number(form.retailPrice),
        groupPrice: Number(form.groupPrice),
        minPoolSize: Number(form.minPoolSize) || 10,
        isActive: form.isActive,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setExpandedId(null);
      await loadData();
    }
    setSaving(false);
  }

  /* ---- Toggle active ---- */

  async function handleToggleActive(product: Product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    await loadData();
  }

  /* ---- Build edit form initial from product ---- */

  function productToForm(p: Product): FormData {
    return {
      name: p.name,
      description: p.description || "",
      vendorId: p.vendor.id,
      category: p.category,
      retailPrice: String(p.retailPrice / 100),
      groupPrice: String(p.groupPrice / 100),
      minPoolSize: String(p.minPoolSize),
      isActive: p.isActive,
    };
  }

  /* ---- Render ---- */

  return (
    <div style={S.page}>
      {/* Shimmer keyframes */}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={20} color="#E84C3D" />
          </div>
          <div>
            <h1 style={S.heading}>Products</h1>
            <p style={S.subtext}>
              {loading ? "Loading..." : `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button
          style={S.btnPrimary}
          onClick={() => {
            setShowCreate(!showCreate);
            setExpandedId(null);
          }}
        >
          {showCreate ? (
            <>
              <X size={15} /> Cancel
            </>
          ) : (
            <>
              <Plus size={15} /> Add Product
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <ProductForm
          stores={stores}
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          saving={saving}
        />
      )}

      {/* Filter bar */}
      <div style={S.filterBar}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 320 }}>
          <Search size={15} color="#9C9590" style={{ position: "absolute", left: 12, top: 12 }} />
          <input
            style={{ ...S.input, width: "100%", paddingLeft: 34 }}
            placeholder="Search products..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Store filter */}
        <select style={S.select} value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
          <option value="">All Stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select style={S.select} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Active toggle */}
        <button
          type="button"
          style={S.togglePill(activeOnly)}
          onClick={() => setActiveOnly(!activeOnly)}
        >
          {activeOnly ? "Active Only" : "Show All"}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && <Skeleton />}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Package size={48} color="#D1D5DB" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: 15, color: "#6B6560", fontWeight: 500 }}>No products found</p>
          <p style={{ fontSize: 13, color: "#9C9590", marginTop: 4 }}>
            {searchText || storeFilter || categoryFilter ? "Try adjusting your filters" : "Add your first product to get started"}
          </p>
        </div>
      )}

      {/* ============ DESKTOP TABLE ============ */}
      {!loading && filtered.length > 0 && (
        <div className="hidden md:block" style={S.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                  {["Product", "Store", "Retail", "Group", "Savings", "Category", "Active", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#9C9590",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const isExpanded = expandedId === product.id;
                  const pct = savingsPercent(product.retailPrice, product.groupPrice);
                  return (
                    <Fragment key={product.id}>
                      <tr
                        style={{
                          borderBottom: "1px solid #F0EBE4",
                          cursor: "pointer",
                          background: isExpanded ? "#FAF9F7" : "transparent",
                          transition: "background 0.15s",
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : product.id)}
                        onMouseEnter={(e) => {
                          if (!isExpanded) (e.currentTarget.style.background = "#FAFAF8");
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) (e.currentTarget.style.background = "transparent");
                        }}
                      >
                        {/* Product name + thumb */}
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={S.thumb(product.imageUrl)}>
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }}
                                />
                              ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <ImageIcon size={16} color="#9C9590" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#2D2A26", whiteSpace: "nowrap" }}>{product.name}</div>
                              {product.description && (
                                <div style={{ fontSize: 11, color: "#9C9590", marginTop: 1, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Store */}
                        <td style={{ padding: "10px 14px", color: "#6B6560", whiteSpace: "nowrap" }}>
                          {product.vendor.name}
                        </td>

                        {/* Retail Price */}
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#2D2A26", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          ₦{koboToNaira(product.retailPrice)}
                        </td>

                        {/* Group Price */}
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1A7D4B", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          ₦{koboToNaira(product.groupPrice)}
                        </td>

                        {/* Savings */}
                        <td style={{ padding: "10px 14px" }}>
                          {pct > 0 && <span style={S.savingsTag}>{pct}% off</span>}
                        </td>

                        {/* Category badge */}
                        <td style={{ padding: "10px 14px" }}>
                          <span style={S.badge(product.category)}>{product.category}</span>
                        </td>

                        {/* Active toggle */}
                        <td style={{ padding: "10px 14px" }} onClick={(e) => e.stopPropagation()}>
                          <Toggle on={product.isActive} onChange={() => handleToggleActive(product)} />
                        </td>

                        {/* Expand arrow */}
                        <td style={{ padding: "10px 14px", color: "#9C9590" }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>

                      {/* Expanded edit form */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <div style={{ padding: "4px 14px 14px" }}>
                              <ProductForm
                                stores={stores}
                                initial={productToForm(product)}
                                onSave={(form) => handleUpdate(product.id, form)}
                                onCancel={() => setExpandedId(null)}
                                saving={saving}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ MOBILE CARDS ============ */}
      {!loading && filtered.length > 0 && (
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((product) => {
            const isExpanded = expandedId === product.id;
            const pct = savingsPercent(product.retailPrice, product.groupPrice);
            return (
              <div key={product.id}>
                <div
                  style={S.mobileCard}
                  onClick={() => setExpandedId(isExpanded ? null : product.id)}
                >
                  {/* Top row: thumb + info */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                    <div style={S.thumb(product.imageUrl)}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon size={16} color="#9C9590" />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#2D2A26" }}>{product.name}</span>
                        {isExpanded ? <ChevronUp size={14} color="#9C9590" /> : <ChevronDown size={14} color="#9C9590" />}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B6560", marginTop: 2 }}>{product.vendor.name}</div>
                    </div>
                  </div>

                  {/* Price row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "#9C9590", textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }}>
                        ₦{koboToNaira(product.retailPrice)}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#1A7D4B", fontVariantNumeric: "tabular-nums" }}>
                        ₦{koboToNaira(product.groupPrice)}
                      </span>
                      {pct > 0 && <span style={S.savingsTag}>{pct}% off</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={S.badge(product.category)}>{product.category}</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Toggle on={product.isActive} onChange={() => handleToggleActive(product)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded edit form (mobile) */}
                {isExpanded && (
                  <div style={{ padding: "0 0 10px" }}>
                    <ProductForm
                      stores={stores}
                      initial={productToForm(product)}
                      onSave={(form) => handleUpdate(product.id, form)}
                      onCancel={() => setExpandedId(null)}
                      saving={saving}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
