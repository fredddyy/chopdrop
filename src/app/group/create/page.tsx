"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  heroImage: string | null;
  imageUrl: string | null;
  topItems: string[];
  deliveryEstimate: string | null;
}

export default function CreateGroupOrderPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-6">
          <div className="h-6 w-[50%] rounded-[8px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div className="h-[100px] w-full rounded-[16px] mb-4" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "100ms" }} />
          <div className="flex gap-3 mb-4">{[0,1,2].map(i => <div key={i} className="flex-1 h-[100px] rounded-[16px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${150+i*80}ms` }} />)}</div>
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
  const gangParam = searchParams.get("gang") || "";

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState(false);
  const [restaurantId, setRestaurantId] = useState(preselectedRestaurant);
  const [search, setSearch] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [deadlineMode, setDeadlineMode] = useState<"preset" | "custom">("preset");
  const [deadlineHours, setDeadlineHours] = useState(2);
  const [customTime, setCustomTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ inviteCode: string; restaurantName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Pre-fill delivery address: gang address > user profile
  useEffect(() => {
    async function prefill() {
      if (gangParam) {
        try {
          const res = await fetch(`/api/gangs/${gangParam}`);
          if (res.ok) {
            const d = await res.json();
            if (d.success && d.data.deliveryAddress) {
              setAddress(d.data.deliveryAddress);
              return;
            }
          }
        } catch {}
      }
      try {
        const stored = localStorage.getItem("chopdrop-customer");
        if (stored) {
          const p = JSON.parse(stored);
          if (p.deliveryAddress) setAddress(p.deliveryAddress);
          if (p.latitude) setLat(p.latitude);
          if (p.longitude) setLng(p.longitude);
        }
      } catch {}
    }
    prefill();
  }, [gangParam]);

  const loadRestaurants = useCallback(() => {
    setRestaurantsLoading(true);
    setRestaurantsError(false);
    fetch("/api/stores?category=Food")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRestaurants(d.data);
        else setRestaurantsError(true);
        setRestaurantsLoading(false);
      })
      .catch(() => { setRestaurantsError(true); setRestaurantsLoading(false); });
  }, []);

  useEffect(() => { loadRestaurants(); }, [loadRestaurants]);

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
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16`);
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
      if (today.getTime() < Date.now()) today.setDate(today.getDate() + 1);
      return today.toISOString();
    }
    return new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toISOString();
  }

  function deadlineDisplay(): string {
    const d = new Date(computeDeadline());
    return d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  async function handleCreate() {
    if (!restaurantId) { setError("Pick a restaurant first"); return; }
    if (!address.trim()) { setError("Add a delivery address so your people know where to come"); return; }
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
          ...(gangParam ? { gang: gangParam } : {}),
        }),
      });
      const d = await res.json();
      if (!d.success) { setError(d.error || "Something went wrong. Try again."); setSubmitting(false); return; }
      const rName = restaurants.find((r) => r.id === restaurantId)?.name || "a restaurant";
      setResult({ inviteCode: d.data.inviteCode, restaurantName: rName });
    } catch {
      setError("Couldn\u2019t reach ChopDrop. Check your connection and try again.");
    }
    setSubmitting(false);
  }

  const filtered = restaurants.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );
  const showDropdown = search.length > 0 && !restaurantId;
  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId);
  const shareUrl = result ? `${typeof window !== "undefined" ? window.location.origin : ""}/group/${result.inviteCode}` : "";
  const whatsappText = result
    ? `Join my group order from ${result.restaurantName}! Add your items before ${deadlineDisplay()}. ${shareUrl}`
    : "";

  /* ═══ SUCCESS SCREEN ═══ */
  if (result) {
    return (
      <main className="flex-1 max-w-[428px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="px-5 pt-8 pb-10">
          {/* Celebration */}
          <div className="rounded-[22px] p-6 text-center" style={{ background: "#1C1C1E" }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4" style={{ background: "var(--emerald)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="m5 12 4 4L19 6" /></svg>
            </div>
            <h1 className="text-[24px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "white" }}>
              Lunch is on!
            </h1>
            <p className="text-[14px] mt-1.5" style={{ color: "var(--subdued)" }}>
              {result.restaurantName} \u00B7 Orders close {deadlineDisplay()}
            </p>
            <p className="text-[12px] mt-3" style={{ color: "var(--subdued)" }}>
              Share the link so your people can pick their food and pay.
            </p>
          </div>

          {/* Invite link */}
          <div className="mt-5 rounded-[16px] p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--text-muted)" }}>Invite link</p>
            <p className="text-[13px] font-bold break-all" style={{ color: "var(--text)" }}>{shareUrl}</p>
          </div>

          {/* WhatsApp share */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share group order on WhatsApp"
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
            className="mt-3 w-full h-[50px] rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-bold press-feedback"
            style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
            {copied ? "Copied!" : "Copy link"}
          </button>

          {/* View order */}
          <Link
            href={`/group/${result.inviteCode}`}
            className="mt-3 w-full h-[50px] rounded-[12px] flex items-center justify-center text-[15px] font-bold press-feedback"
            style={{ background: "var(--coral)", color: "white" }}
          >
            Add your items
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  /* ═══ FORM ═══ */
  return (
    <main className="flex-1 max-w-[428px] mx-auto w-full min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-4 pb-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 rounded-full flex items-center justify-center press-feedback" style={{ background: "var(--sand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: "var(--coral)" }}>Group Order</p>
            <h1 className="text-[22px] font-extrabold leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>
              Where we chopping?
            </h1>
          </div>
        </div>

        {/* ═══ RESTAURANT PICKER ═══ */}
        <div className="mb-6">
          <label htmlFor="restaurant-search" className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--coral)" }}>
            Pick a kitchen
          </label>

          {/* Selected restaurant card */}
          {selectedRestaurant && (
            <div className="rounded-[16px] overflow-hidden mb-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {(selectedRestaurant.heroImage || selectedRestaurant.imageUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedRestaurant.heroImage || selectedRestaurant.imageUrl || ""} alt={selectedRestaurant.name} className="w-full h-[120px] object-cover" />
              )}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--text)" }}>{selectedRestaurant.name}</p>
                  {selectedRestaurant.address && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{selectedRestaurant.address}</p>}
                </div>
                <button type="button" onClick={() => { setRestaurantId(""); setSearch(""); }} aria-label="Change restaurant" className="text-[12px] font-bold press-feedback" style={{ color: "var(--coral)" }}>Change</button>
              </div>
            </div>
          )}

          {/* Search input */}
          {!restaurantId && (
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                id="restaurant-search"
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (restaurantId) setRestaurantId(""); }}
                placeholder="Search restaurants..."
                autoComplete="off"
                className="w-full h-[48px] rounded-[12px] pl-10 pr-4 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
                style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              {/* Dropdown results */}
              {showDropdown && filtered.length > 0 && (
                <div className="absolute left-0 right-0 top-[52px] z-20 rounded-[12px] overflow-hidden max-h-[240px] overflow-y-auto" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  {filtered.slice(0, 8).map((r) => (
                    <button key={r.id} type="button" onClick={() => { setRestaurantId(r.id); setSearch(r.name); }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 press-feedback" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="w-[44px] h-[44px] rounded-[10px] shrink-0 overflow-hidden" style={{ background: "var(--sand)" }}>
                        {(r.heroImage || r.imageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.heroImage || r.imageUrl || ""} alt={r.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[14px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.3 }}>{r.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold truncate" style={{ color: "var(--text)" }}>{r.name}</p>
                        {r.address && <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{r.address}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Restaurant grid — visible when not searching */}
          {!restaurantId && !search && (
            <>
              {restaurantsLoading && (
                <div className="flex gap-3 mt-3">
                  {[0,1,2].map(i => <div key={i} className="flex-1 h-[110px] rounded-[16px]" style={{ background: "var(--sand)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i*80}ms` }} />)}
                </div>
              )}
              {restaurantsError && !restaurantsLoading && (
                <div className="mt-3 p-4 rounded-[12px] text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>Couldn&apos;t load restaurants</p>
                  <button type="button" onClick={loadRestaurants} className="text-[12px] font-bold mt-1 press-feedback" style={{ color: "var(--coral)" }}>Try again</button>
                </div>
              )}
              {!restaurantsLoading && !restaurantsError && restaurants.length > 0 && (
                <div className="overflow-x-auto hide-scrollbar mt-3">
                  <div className="flex gap-2.5 w-max pb-1">
                    {restaurants.slice(0, 8).map((r) => (
                      <button key={r.id} type="button" onClick={() => { setRestaurantId(r.id); setSearch(r.name); }}
                        className="shrink-0 w-[130px] rounded-[16px] overflow-hidden press-feedback text-left" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <div className="h-[80px]" style={{ background: "var(--sand)" }}>
                          {(r.heroImage || r.imageUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.heroImage || r.imageUrl || ""} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[20px] font-extrabold" style={{ color: "var(--text-muted)", opacity: 0.15 }}>{r.name.charAt(0)}</div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-[12px] font-bold truncate" style={{ color: "var(--text)" }}>{r.name}</p>
                          {r.topItems.length > 0 && <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{r.topItems.slice(0,2).join(", ")}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ DELIVERY ADDRESS ═══ */}
        <div className="mb-6">
          <label htmlFor="delivery-addr" className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2 block" style={{ color: "var(--coral)" }}>
            Drop-off
          </label>
          <input
            id="delivery-addr"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Where should we deliver?"
            autoComplete="street-address"
            className="w-full h-[48px] rounded-[12px] px-4 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)] mb-2"
            style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 text-[12px] font-bold press-feedback"
            style={{ color: "var(--coral)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {locating ? "Finding you..." : "Use my location"}
          </button>
        </div>

        {/* ═══ DEADLINE ═══ */}
        <div className="mb-6" role="group" aria-label="Order deadline">
          <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2 block" style={{ color: "var(--coral)" }}>
            Orders close
          </label>
          <div className="flex gap-2 mb-2">
            {[1, 2, 3].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => { setDeadlineMode("preset"); setDeadlineHours(h); }}
                className="h-[44px] flex-1 rounded-[12px] text-[13px] font-bold press-feedback"
                style={{
                  background: deadlineMode === "preset" && deadlineHours === h ? "var(--text)" : "var(--card)",
                  color: deadlineMode === "preset" && deadlineHours === h ? "white" : "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  transition: "background 150ms ease-out, color 150ms ease-out",
                }}
              >
                In {h}h
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDeadlineMode("custom")}
              className="h-[44px] flex-1 rounded-[12px] text-[13px] font-bold press-feedback"
              style={{
                background: deadlineMode === "custom" ? "var(--text)" : "var(--card)",
                color: deadlineMode === "custom" ? "white" : "var(--text-secondary)",
                border: "1px solid var(--border)",
                transition: "background 150ms ease-out, color 150ms ease-out",
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
              aria-label="Custom deadline time"
              className="w-full h-[48px] rounded-[12px] px-4 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral)]"
              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          )}
          <p className="text-[11px] mt-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            Delivery fee split among all members
          </p>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-4 p-3.5 rounded-[12px] flex items-start gap-2.5" style={{ background: "#FEF2F0", border: "1px solid #FECACA" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <div>
              <p className="text-[13px] font-bold" style={{ color: "var(--coral)" }}>{error}</p>
              <button type="button" onClick={() => setError("")} className="text-[12px] font-bold mt-1 press-feedback" style={{ color: "var(--text-muted)" }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting}
          className="w-full h-[50px] rounded-[12px] flex items-center justify-between px-5 text-[15px] font-bold text-white press-feedback disabled:opacity-50"
          style={{ background: "var(--coral)", transition: "opacity 150ms ease-out" }}
        >
          <span>{submitting ? "Creating\u2026" : "Create & Share"}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </div>
      <BottomNav />
    </main>
  );
}
