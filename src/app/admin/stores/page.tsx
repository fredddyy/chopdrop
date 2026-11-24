"use client";

import { useEffect, useState, useMemo } from "react";
import { Store, Search, Plus, ChevronDown, ChevronUp, X, Check, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StoreData {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  groupDiscount: number;
  groupTarget: number;
  deliveryFee: number;
  freeDeliveryMin: number;
  _count?: { products: number };
  menuCategories?: { items: unknown[] }[];
}

interface EditFields {
  name: string;
  address: string;
  phone: string;
  groupDiscount: number;
  deliveryFee: number;
  isActive: boolean;
}

/* ------------------------------------------------------------------ */
/*  Design tokens (inline)                                             */
/* ------------------------------------------------------------------ */

const T = {
  bg: "#FAF9F7",
  card: "#FFFFFF",
  border: "#E5E7EB",
  coral: "#E84C3D",
  coralDark: "#D1382A",
  charcoal: "#1C1C1E",
  secondary: "#6B7280",
  muted: "#9CA3AF",
  sand: "#F3F4F6",
  forest: "#1A7D4B",
  forestBg: "rgba(26,125,75,0.08)",
  coralBg: "rgba(232,76,61,0.08)",
  radius: 14,
  radiusSm: 10,
  font: "'Bricolage Grotesque', sans-serif",
  body: "'Inter', sans-serif",
} as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNaira(kobo: number): string {
  return `\u20A6${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function productCount(store: StoreData): number {
  if (store._count?.products != null) return store._count.products;
  if (store.menuCategories) {
    return store.menuCategories.reduce((sum, cat) => sum + (cat.items?.length ?? 0), 0);
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: 16,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      {/* Avatar skeleton */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: T.radiusSm,
          background: T.sand,
          flexShrink: 0,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ width: "60%", height: 16, borderRadius: 6, background: T.sand, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "80%", height: 12, borderRadius: 6, background: T.sand, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 60, height: 12, borderRadius: 6, background: T.sand, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 50, height: 12, borderRadius: 6, background: T.sand, animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Store card                                                         */
/* ------------------------------------------------------------------ */

function StoreCard({
  store,
  expanded,
  onToggle,
  onSaved,
}: {
  store: StoreData;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const [edit, setEdit] = useState<EditFields>({
    name: store.name,
    address: store.address,
    phone: store.phone,
    groupDiscount: store.groupDiscount,
    deliveryFee: store.deliveryFee,
    isActive: store.isActive,
  });
  const [saving, setSaving] = useState(false);

  // Sync when store prop changes
  useEffect(() => {
    setEdit({
      name: store.name,
      address: store.address,
      phone: store.phone,
      groupDiscount: store.groupDiscount,
      deliveryFee: store.deliveryFee,
      isActive: store.isActive,
    });
  }, [store]);

  async function handleSave() {
    setSaving(true);
    const changed: Record<string, unknown> = {};
    if (edit.name !== store.name) changed.name = edit.name;
    if (edit.address !== store.address) changed.address = edit.address;
    if (edit.phone !== store.phone) changed.phone = edit.phone;
    if (edit.groupDiscount !== store.groupDiscount) changed.groupDiscount = edit.groupDiscount;
    if (edit.deliveryFee !== store.deliveryFee) changed.deliveryFee = edit.deliveryFee;
    if (edit.isActive !== store.isActive) changed.isActive = edit.isActive;

    if (Object.keys(changed).length > 0) {
      await fetch(`/api/admin/restaurants/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });
    }
    setSaving(false);
    onSaved();
  }

  const count = productCount(store);

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        overflow: "hidden",
        transition: "border-color 0.15s ease-out",
      }}
    >
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: 16,
          width: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Avatar / image */}
        {store.imageUrl ? (
          <img
            src={store.imageUrl}
            alt={store.name}
            style={{
              width: 48,
              height: 48,
              borderRadius: T.radiusSm,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: T.radiusSm,
              background: T.coralBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: T.coral,
              fontFamily: T.font,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {getInitials(store.name)}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span
              style={{
                fontFamily: T.font,
                fontWeight: 700,
                fontSize: 15,
                color: T.charcoal,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {store.name}
            </span>
            {/* Active badge */}
            <span
              style={{
                fontSize: 10,
                fontFamily: T.body,
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: 20,
                background: store.isActive ? T.forestBg : T.sand,
                color: store.isActive ? T.forest : T.muted,
                flexShrink: 0,
              }}
            >
              {store.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              color: T.secondary,
              fontFamily: T.body,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {store.address}
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: T.muted, fontFamily: T.body }}>
              {count} product{count !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 11, color: T.forest, fontFamily: T.body, fontWeight: 600 }}>
              {store.groupDiscount}% group
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        {expanded ? (
          <ChevronUp size={18} style={{ color: T.muted, flexShrink: 0 }} />
        ) : (
          <ChevronDown size={18} style={{ color: T.muted, flexShrink: 0 }} />
        )}
      </button>

      {/* Expanded edit form */}
      {expanded && (
        <div
          style={{
            padding: "0 16px 16px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ height: 12 }} />

          {/* Name */}
          <label style={labelStyle}>
            Name
            <input
              style={inputStyle}
              value={edit.name}
              onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
            />
          </label>

          {/* Address */}
          <label style={labelStyle}>
            Address
            <input
              style={inputStyle}
              value={edit.address}
              onChange={(e) => setEdit((p) => ({ ...p, address: e.target.value }))}
            />
          </label>

          {/* Phone */}
          <label style={labelStyle}>
            Phone
            <input
              style={inputStyle}
              value={edit.phone}
              onChange={(e) => setEdit((p) => ({ ...p, phone: e.target.value }))}
            />
          </label>

          {/* Row: groupDiscount + deliveryFee */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Group discount %
              <input
                type="number"
                min={0}
                max={100}
                style={inputStyle}
                value={edit.groupDiscount}
                onChange={(e) =>
                  setEdit((p) => ({ ...p, groupDiscount: parseInt(e.target.value) || 0 }))
                }
              />
            </label>
            <label style={labelStyle}>
              Delivery fee (naira)
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: T.muted,
                    fontSize: 13,
                    fontFamily: T.body,
                    pointerEvents: "none",
                  }}
                >
                  {"\u20A6"}
                </span>
                <input
                  type="number"
                  min={0}
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  value={Math.round(edit.deliveryFee / 100)}
                  onChange={(e) =>
                    setEdit((p) => ({
                      ...p,
                      deliveryFee: (parseInt(e.target.value) || 0) * 100,
                    }))
                  }
                />
              </div>
            </label>
          </div>

          {/* Active toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
            }}
          >
            <span style={{ fontSize: 13, fontFamily: T.body, fontWeight: 500, color: T.charcoal }}>
              Store active
            </span>
            <button
              type="button"
              onClick={() => setEdit((p) => ({ ...p, isActive: !p.isActive }))}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: edit.isActive ? T.forest : T.sand,
                position: "relative",
                transition: "background 0.15s ease-out",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: edit.isActive ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: T.card,
                  transition: "left 0.15s ease-out",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              />
            </button>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              height: 44,
              borderRadius: T.radiusSm,
              border: "none",
              background: T.coral,
              color: "#FFFFFF",
              fontSize: 13,
              fontFamily: T.font,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background 0.15s ease-out, opacity 0.15s ease-out",
            }}
            onMouseEnter={(e) => {
              if (!saving) (e.currentTarget.style.background = T.coralDark);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.coral;
            }}
          >
            {saving ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={16} />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create store form                                                  */
/* ------------------------------------------------------------------ */

function CreateStoreForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !address.trim()) return;
    setSaving(true);
    await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), address: address.trim(), phone: phone.trim() }),
    });
    setSaving(false);
    onCreated();
  }

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.coral}`,
        borderRadius: T.radius,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3
          style={{
            fontFamily: T.font,
            fontWeight: 700,
            fontSize: 15,
            color: T.charcoal,
            margin: 0,
          }}
        >
          New store
        </h3>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
        >
          <X size={18} style={{ color: T.muted }} />
        </button>
      </div>

      <label style={labelStyle}>
        Store name *
        <input
          style={inputStyle}
          placeholder="e.g. Mama Put Kitchen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </label>

      <label style={labelStyle}>
        Address *
        <input
          style={inputStyle}
          placeholder="e.g. 12 Adeola Odeku, VI"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </label>

      <label style={labelStyle}>
        Phone
        <input
          style={inputStyle}
          placeholder="e.g. 08012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            height: 44,
            borderRadius: T.radiusSm,
            border: `1px solid ${T.border}`,
            background: T.card,
            color: T.secondary,
            fontSize: 13,
            fontFamily: T.font,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !name.trim() || !address.trim()}
          style={{
            flex: 1,
            height: 44,
            borderRadius: T.radiusSm,
            border: "none",
            background: !name.trim() || !address.trim() ? T.sand : T.coral,
            color: !name.trim() || !address.trim() ? T.muted : "#FFFFFF",
            fontSize: 13,
            fontFamily: T.font,
            fontWeight: 700,
            cursor: saving || !name.trim() || !address.trim() ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {saving ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <Plus size={16} />}
          {saving ? "Creating..." : "Create store"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared input styles                                                */
/* ------------------------------------------------------------------ */

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  color: T.muted,
  fontFamily: T.body,
};

const inputStyle: React.CSSProperties = {
  height: 40,
  borderRadius: T.radiusSm,
  border: `1px solid ${T.border}`,
  background: T.card,
  padding: "0 12px",
  fontSize: 14,
  fontFamily: T.body,
  color: T.charcoal,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function loadStores() {
    setLoading(true);
    const res = await fetch("/api/admin/restaurants?all=true");
    const data = await res.json();
    if (data.success) setStores(data.data);
    setLoading(false);
  }

  useEffect(() => {
    loadStores();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return stores;
    const q = search.toLowerCase();
    return stores.filter(
      (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
  }, [stores, search]);

  const activeCount = stores.filter((s) => s.isActive).length;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Keyframes for skeleton pulse + spinner */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: T.radiusSm,
              background: T.coralBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Store size={18} style={{ color: T.coral }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: T.font,
                fontWeight: 800,
                fontSize: 20,
                color: T.charcoal,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Stores
            </h1>
            <p
              style={{
                fontFamily: T.body,
                fontSize: 11,
                color: T.muted,
                margin: 0,
              }}
            >
              {loading ? "Loading..." : `${stores.length} total, ${activeCount} active`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setExpandedId(null);
          }}
          style={{
            height: 36,
            padding: "0 14px",
            borderRadius: T.radiusSm,
            border: "none",
            background: T.coral,
            color: "#FFFFFF",
            fontSize: 12,
            fontFamily: T.font,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "background 0.15s ease-out",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.coralDark)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.coral)}
        >
          <Plus size={15} />
          Add store
        </button>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: T.muted,
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search stores by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            height: 42,
            borderRadius: T.radiusSm,
            border: `1px solid ${T.border}`,
            background: T.card,
            paddingLeft: 36,
            paddingRight: search ? 36 : 12,
            fontSize: 13,
            fontFamily: T.body,
            color: T.charcoal,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={14} style={{ color: T.muted }} />
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ marginBottom: 12 }}>
          <CreateStoreForm
            onCreated={() => {
              setShowCreate(false);
              loadStores();
            }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Store list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            color: T.muted,
            fontFamily: T.body,
            fontSize: 13,
          }}
        >
          {search ? `No stores matching "${search}"` : "No stores yet. Add your first store above."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              expanded={expandedId === store.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === store.id ? null : store.id))
              }
              onSaved={() => {
                setExpandedId(null);
                loadStores();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
