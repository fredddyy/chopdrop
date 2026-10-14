"use client";

import { useState, useEffect } from "react";
import { MealCard } from "./meal-card";
import { CountdownTimer } from "./countdown-timer";
import { BottomNav } from "./bottom-nav";
import { useCart } from "@/lib/cart";
import { getCustomerProfile } from "@/lib/customer";
import Link from "next/link";
import { Logo } from "@/components/logo";

interface CategoryItem {
  id: string;
  name: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
  selectionRule: string;
  items: CategoryItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  tag: string;
  type: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  startTime: string;
  endTime: string;
  remaining: number;
  expired: boolean;
  categories?: Category[];
}

interface RestaurantInfo {
  id: string;
  name: string;
  imageUrl: string | null;
  address: string;
  mealCount: number;
  previewImage: string | null;
}

interface MenuContentProps {
  items: MenuItem[];
  restaurants: RestaurantInfo[];
  cutoffTime: string;
  allExpired: boolean;
}

export function MenuContent({ items, restaurants, cutoffTime, allExpired }: MenuContentProps) {
  const [toast, setToast] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [collectionPoint, setCollectionPoint] = useState("");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const cart = useCart();

  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) {
      setOfficeName(profile.officeName || "");
      setCollectionPoint(profile.collectionPoint || "");
    }
  }, []);

  // Show sticky countdown bar when scrolled past hero
  useEffect(() => {
    function handleScroll() {
      setShowStickyBar(window.scrollY > 200);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [activeFilter, setActiveFilter] = useState("All");
  const kitchenCount = restaurants.length;
  // Only show fixed combo meals on the main menu — individual items are on restaurant pages
  const allComboMeals = items.filter((i) => i.type === "FIXED");
  const comboMeals = activeFilter === "All"
    ? allComboMeals
    : activeFilter === "Under ₦3k"
    ? allComboMeals.filter((m) => m.price < 300000)
    : allComboMeals; // Other filters can be extended later

  function handleAddFixed(meal: MenuItem) {
    cart.addItem({
      dailyMenuId: meal.id,
      name: meal.name,
      description: meal.description || "",
      imageUrl: meal.imageUrl,
      restaurantName: meal.restaurantName,
      price: meal.price,
    });
    setToast("Added to your ChopDrop");
    setTimeout(() => setToast(""), 1800);
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full pb-20">
      {/* Mobile Header */}
      <header className="md:hidden bg-paper sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo size={28} />
          <div className="flex items-center gap-2">
            {cart.totalItems > 0 && (
              <Link href="/cart" className="relative w-10 h-10 rounded-[10px] border border-line flex items-center justify-center text-ink-soft hover:bg-cream transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" />
                </svg>
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-coral text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">{cart.totalItems}</span>
              </Link>
            )}
            <button className="w-10 h-10 rounded-[10px] border border-line flex items-center justify-center text-ink-soft hover:bg-cream transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
            </button>
          </div>
        </div>
        {/* Location bar */}
        <div className="flex items-center justify-between px-4 pb-2">
          {officeName ? (
            <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-green flex-shrink-0">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-ink">{officeName}</span>
              {collectionPoint && <span>&middot; {collectionPoint}</span>}
            </div>
          ) : (
            <Link href="/auth" className="flex items-center gap-1.5 text-[11px]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-coral flex-shrink-0">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-coral">Set your office</span>
              <span className="text-ink-soft">&middot; Ikeja</span>
            </Link>
          )}
        </div>
      </header>

      {/* Sticky countdown bar — appears on scroll */}
      {showStickyBar && !allExpired && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green text-white md:hidden" style={{ animation: "slideDown 0.2s ease" }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-lime text-[9px] font-extrabold uppercase tracking-[0.1em]">
                {new Date().toLocaleDateString("en-US", { weekday: "short" })} drop
              </span>
              <span className="text-white/40">·</span>
              <CountdownTimer cutoffTime={cutoffTime} compact />
            </div>
            {cart.totalItems > 0 && (
              <Link href="/cart" className="flex items-center gap-1.5 bg-coral text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" />
                </svg>
                {cart.totalItems}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Compact Hero Card */}
      <section className="mx-4 md:mx-8 mt-2 bg-green text-white rounded-[16px] overflow-hidden relative">
        <div className="absolute w-[120px] h-[120px] border-[30px] border-white/[0.04] rounded-full -bottom-10 right-4" />
        <div className="px-5 py-5 relative z-10">
          <span className="inline-block bg-amber-soft text-[#7d5716] text-[9px] font-extrabold uppercase tracking-[0.07em] px-2 py-1 rounded-full mb-2.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long" })} lunch drop
          </span>
          <h1 className="font-display font-bold text-[24px] md:text-[32px] leading-[1] tracking-[-0.04em]">
            Lunch is sorted.
          </h1>
          <p className="text-[#d3e3dc] text-[12px] mt-1.5 max-w-[320px] leading-relaxed">
            Everyone orders &amp; pays before 10:30. Food arrives together at 12:30.
          </p>
          <div className="mt-3">
            <CountdownTimer cutoffTime={cutoffTime} />
            <div className="flex items-center gap-3 mt-2 text-[#b8c6c1] text-[10px]">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
                  <path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" />
                </svg>
                Batch drop at 12:30 PM
              </span>
              <span>·</span>
              <span>100% prepaid</span>
            </div>
          </div>
        </div>
      </section>

      {allExpired ? (
        <div className="text-center py-20 px-5">
          <div className="font-display font-bold text-2xl mb-2">Today&apos;s orders are closed</div>
          <p className="text-ink-soft text-sm mb-6">Come back tomorrow at 9:00 AM for fresh meals.</p>
          <div className="bg-paper border border-line rounded-2xl p-6 max-w-sm mx-auto">
            <p className="text-sm font-semibold mb-2">Already ordered?</p>
            <Link href="/orders" className="text-green font-bold text-sm hover:underline">Check your order status</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Social proof bar */}
          <div className="px-5 md:px-12 pt-5">
            <div className="flex items-center gap-2 bg-green-soft rounded-[10px] px-3.5 py-2.5">
              <div className="flex -space-x-1.5">
                {["AO", "TC", "EO"].map((init) => (
                  <div key={init} className="w-6 h-6 rounded-full bg-amber text-ink text-[8px] font-extrabold flex items-center justify-center border-2 border-green-soft">{init}</div>
                ))}
              </div>
              <span className="text-green text-[11px] font-semibold">
                {items.reduce((s, i) => s + (i.remaining < 30 ? 30 - i.remaining : 0), 0) || 12} people at your office joined today&apos;s drop
              </span>
            </div>
          </div>

          {/* Meals Section */}
          <section id="meals" className="px-5 md:px-12 py-8 md:py-14 scroll-mt-4">
            <div className="flex justify-between items-end mb-4">
              <h2 className="font-display font-[750] text-[26px] tracking-[-0.04em]">Pick your lunch</h2>
              <div className="text-ink-soft text-xs">{comboMeals.length} meals &middot; {kitchenCount} kitchens</div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5 mb-5 pb-1">
              {[
                { label: "All", icon: "M4 6h16M4 12h16M4 18h16" },
                { label: "Under ₦3k", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
                { label: "Swallow", icon: "" },
                { label: "Rice dishes", icon: "" },
                { label: "Sides only", icon: "" },
                { label: "Free delivery", icon: "M3 6h11v11H3zM14 10h4l3 4v3h-7z" },
              ].map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setActiveFilter(filter.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold flex-shrink-0 transition-colors ${
                    activeFilter === filter.label
                      ? "bg-ink text-white"
                      : "bg-paper border border-line text-ink-soft hover:border-ink-soft/30"
                  }`}
                >
                  {filter.icon && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={filter.icon} /></svg>
                  )}
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Restaurant quick links */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5 mb-6 pb-1">
              {restaurants.map((r) => {
                const initials = r.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <Link key={r.id} href={`/restaurant/${r.id}`} className="flex items-center gap-2 bg-paper border border-line rounded-[11px] px-3 py-2 flex-shrink-0 hover:border-green/30 transition-colors group">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                      {r.previewImage ? (
                        <img src={r.previewImage} alt={r.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                      ) : null}
                      <div className={`w-full h-full bg-green-soft text-green flex items-center justify-center text-[10px] font-extrabold ${r.previewImage ? "hidden" : ""}`}>
                        {initials}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold group-hover:text-green transition-colors">{r.name}</div>
                      <div className="text-[9px] text-ink-soft">{r.mealCount} meal{r.mealCount !== 1 ? "s" : ""}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft/50 group-hover:text-green transition-colors flex-shrink-0">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                );
              })}
            </div>

            {/* Meal Grid — only combos, individual items are on restaurant pages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comboMeals.map((item) => (
                <MealCard
                  key={item.id}
                  dailyMenuId={item.id}
                  name={item.name}
                  description={item.description}
                  imageUrl={item.imageUrl}
                  price={item.price}
                  tag={item.tag}
                  type={item.type}
                  restaurantName={item.restaurantName}
                  restaurantAddress={item.restaurantAddress}
                  startTime={item.startTime}
                  endTime={item.endTime}
                  remaining={item.remaining}
                  expired={item.expired}
                  onAdd={() => handleAddFixed(item)}
                />
              ))}
            </div>

            {/* Browse individual items CTA */}
            <div className="mt-5 bg-paper border border-line rounded-[14px] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-soft rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg">
                    🍗
                  </div>
                  <div>
                    <strong className="font-display font-bold text-[14px] block">Just want sides or protein?</strong>
                    <span className="text-ink-soft text-[11px]">Browse any restaurant&apos;s full menu and pick individual items.</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {restaurants.map((r) => (
                  <Link
                    key={r.id}
                    href={`/restaurant/${r.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-cream hover:bg-line border border-line rounded-[10px] py-2 text-[11px] font-bold text-ink transition-colors"
                  >
                    {r.name.split(" ")[0]}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="bg-amber px-5 md:px-12 py-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              ["01", "No guesswork", "Pick your meal before 10:30. Restaurants cook exactly what's ordered."],
              ["02", "No cash drama", "Everyone pays upfront with Paystack. No IOUs, no shortfalls."],
              ["03", "One clean drop", "All meals arrive together at 12:30. Your assistant distributes by code."],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-3">
                <span className="w-[22px] h-[22px] border border-ink/30 rounded-full flex items-center justify-center text-[9px] font-extrabold flex-shrink-0 mt-0.5">{num}</span>
                <div>
                  <strong className="font-display text-[13px] font-bold">{title}</strong>
                  <p className="text-[10px] text-[#725f39] mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed z-[100] left-1/2 bottom-6 -translate-x-1/2 bg-ink text-white rounded-[11px] shadow-[0_15px_35px_rgba(0,0,0,0.22)] px-4 py-3 flex items-center gap-2 text-xs font-bold animate-[toastIn_0.25s_ease]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
            <path d="m5 12 4 4L19 6" />
          </svg>
          {toast}
        </div>
      )}

      <BottomNav />

      <style jsx global>{`
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 10px); } }
      `}</style>
    </main>
  );
}
