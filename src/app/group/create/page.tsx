"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Restaurant {
  id: string;
  name: string;
  address: string;
}

function fp(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

export default function CreateGroupOrderPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 max-w-[480px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6">
          <div className="h-6 w-[50%] rounded-[8px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-[48px] w-full rounded-[12px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
          <div className="h-[48px] w-full rounded-[12px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "200ms" }} />
        </div>
      </main>
    }>
      <CreateGroupOrderInner />
    </Suspense>
  );
}

function CreateGroupOrderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRestaurant = searchParams.get("restaurant") || "";

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantId, setRestaurantId] = useState(preselectedRestaurant);
  const [search, setSearch] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [deadlineMode, setDeadlineMode] = useState<"pill" | "custom">("pill");
  const [deadlineHours, setDeadlineHours] = useState(2);
  const [customTime, setCustomTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ inviteCode: string; restaurantName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRestaurants(d.data);
      })
      .catch(() => {});
  }, []);

  // Set restaurant name in search field when preselected
  useEffect(() => {
    if (preselectedRestaurant && restaurants.length > 0) {
      const found = restaurants.find((r) => r.id === preselectedRestaurant);
      if (found) setSearch(found.name);
    }
  }, [preselectedRestaurant, restaurants]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16`
          );
          const data = await res.json();
          setAddress(data.display_name?.split(",").slice(0, 3).join(",") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  function computeDeadline(): string {
    if (deadlineMode === "custom" && customTime) {
      const today = new Date();
      const [h, m] = customTime.split(":").map(Number);
      today.setHours(h, m, 0, 0);
      return today.toISOString();
    }
    return new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toISOString();
  }

  async function handleCreate() {
    if (!restaurantId) { setError("Pick a restaurant"); return; }
    if (!address.trim()) { setError("Enter a delivery address"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/group-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          deliveryAddress: address.trim(),
          deliveryLat: lat,
          deliveryLng: lng,
          deadline: computeDeadline(),
        }),
      });
      const d = await res.json();
      if (!d.success) { setError(d.error || "Something went wrong"); setSubmitting(false); return; }
      const rName = restaurants.find((r) => r.id === restaurantId)?.name || "a restaurant";
      setResult({ inviteCode: d.data.inviteCode, restaurantName: rName });
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  const filtered = restaurants.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );
  const showDropdown = search.length > 0 && !restaurantId;
  const shareUrl = result ? `${typeof window !== "undefined" ? window.location.origin : ""}/group/${result.inviteCode}` : "";
  const deadlineLabel = deadlineMode === "custom" && customTime
    ? customTime
    : `in ${deadlineHours}h`;
  const whatsappText = result
    ? `Join my group order from ${result.restaurantName}! Add your items before ${deadlineLabel}. ${shareUrl}`
    : "";

  // Share sheet after creation
  if (result) {
    return (
      <main className="flex-1 max-w-[480px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6 pb-10">
          <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-5" style={{ background: "#F0FDF4" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
          </div>
          <h1 className="text-[24px] font-extrabold text-center" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
            Group order created
          </h1>
          <p className="text-[14px] text-center mt-2" style={{ color: "var(--text-secondary)" }}>
            Share the link so your people can add their items.
          </p>

          <div className="mt-8 rounded-[16px] p-4" style={{ background: "var(--sand)", border: "1px solid var(--border)" }}>
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "var(--text-muted)" }}>Invite link</p>
            <p className="text-[14px] font-bold break-all" style={{ color: "#1C1C1E" }}>{shareUrl}</p>
          </div>

          {/* WhatsApp share */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full h-[50px] rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-bold text-white press-feedback"
            style={{ background: "#25D366" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Share on WhatsApp
          </a>

          {/* Copy link */}
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="mt-3 w-full h-[50px] rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-bold press-feedback cursor-pointer"
            style={{ background: "var(--sand)", color: "#1C1C1E", border: "1px solid var(--border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
            {copied ? "Copied!" : "Copy link"}
          </button>

          {/* View order */}
          <Link
            href={`/group/${result.inviteCode}`}
            className="mt-3 w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold press-feedback"
            style={{ background: "#E84C3D", color: "white" }}
          >
            View group order
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[480px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-4 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h1 className="text-[22px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
            Start Group Order
          </h1>
        </div>

        {/* Restaurant picker */}
        <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-2 block" style={{ color: "var(--text-muted)" }}>
          Restaurant
        </label>
        <div className="relative mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (restaurantId) setRestaurantId(""); }}
            placeholder="Search restaurants..."
            className="w-full h-[48px] rounded-[12px] px-4 text-[14px] font-medium outline-none"
            style={{ background: "var(--sand)", color: "#1C1C1E", border: "1px solid var(--border)" }}
          />
          {restaurantId && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
          )}
          {showDropdown && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-[52px] z-20 rounded-[12px] overflow-hidden max-h-[200px] overflow-y-auto" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {filtered.slice(0, 8).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setRestaurantId(r.id); setSearch(r.name); }}
                  className="w-full text-left px-4 py-3 cursor-pointer"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <p className="text-[14px] font-bold" style={{ color: "#1C1C1E" }}>{r.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{r.address}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delivery address */}
        <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-2 block" style={{ color: "var(--text-muted)" }}>
          Delivery address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Where should we deliver?"
          className="w-full h-[48px] rounded-[12px] px-4 text-[14px] font-medium outline-none mb-2"
          style={{ background: "var(--sand)", color: "#1C1C1E", border: "1px solid var(--border)" }}
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-[12px] font-bold mb-6 cursor-pointer"
          style={{ color: "#E84C3D" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          {locating ? "Getting location..." : "Use my location"}
        </button>

        {/* Deadline */}
        <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-2 block" style={{ color: "var(--text-muted)" }}>
          Order deadline
        </label>
        <div className="flex gap-2 mb-3">
          {[1, 2, 3].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => { setDeadlineMode("pill"); setDeadlineHours(h); }}
              className="h-[36px] px-4 rounded-[10px] text-[13px] font-bold cursor-pointer"
              style={{
                background: deadlineMode === "pill" && deadlineHours === h ? "#1C1C1E" : "var(--sand)",
                color: deadlineMode === "pill" && deadlineHours === h ? "white" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {h}h
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDeadlineMode("custom")}
            className="h-[36px] px-4 rounded-[10px] text-[13px] font-bold cursor-pointer"
            style={{
              background: deadlineMode === "custom" ? "#1C1C1E" : "var(--sand)",
              color: deadlineMode === "custom" ? "white" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Custom
          </button>
        </div>
        {deadlineMode === "custom" && (
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="w-full h-[48px] rounded-[12px] px-4 text-[14px] font-medium outline-none mb-3"
            style={{ background: "var(--sand)", color: "#1C1C1E", border: "1px solid var(--border)" }}
          />
        )}

        {error && (
          <p className="text-[13px] font-bold mb-4" style={{ color: "#E84C3D" }}>{error}</p>
        )}

        {/* Create CTA */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting}
          className="w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold text-white cursor-pointer press-feedback mt-4"
          style={{ background: submitting ? "var(--text-muted)" : "#E84C3D" }}
        >
          {submitting ? "Creating..." : "Create & Share"}
        </button>
      </div>
    </main>
  );
}
