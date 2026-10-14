"use client";

import Link from "next/link";
import { formatNaira } from "@/lib/utils";
import { CountdownTimer } from "./countdown-timer";
import { BottomNav } from "./bottom-nav";

interface ComboMeal {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  tag: string;
  startTime: string;
  endTime: string;
  remaining: number;
  expired: boolean;
}

interface BuildPlateInfo {
  dailyMenuId: string;
  imageUrl: string | null;
  minPrice: number;
  remaining: number;
  categories: { id: string; name: string; selectionRule: string; itemCount: number }[];
}

interface RestaurantContentProps {
  restaurant: { id: string; name: string; address: string; imageUrl: string | null };
  combos: ComboMeal[];
  buildPlate: BuildPlateInfo | null;
  cutoffTime: string;
  allExpired: boolean;
}

export function RestaurantContent({ restaurant, combos, buildPlate, cutoffTime, allExpired }: RestaurantContentProps) {
  return (
    <main className="flex-1 max-w-2xl mx-auto w-full pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-paper border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/menu" className="w-9 h-9 rounded-full bg-cream flex items-center justify-center hover:bg-line transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-lg leading-tight">{restaurant.name}</h1>
            <p className="text-ink-soft text-[11px]">{restaurant.address}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        <CountdownTimer cutoffTime={cutoffTime} compact />

        {allExpired ? (
          <div className="text-center py-12 mt-4">
            <p className="text-ink-soft">Orders are closed for today.</p>
            <Link href="/menu" className="text-green text-sm font-bold mt-2 block">Back to menu</Link>
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-xl mt-6 mb-1">How would you like to order?</h2>
            <p className="text-ink-soft text-sm mb-5">Pick a ready combo or build your own plate.</p>

            {/* Two option cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <a href="#combos" className="bg-paper border-2 border-green/20 rounded-2xl p-5 text-center hover:border-green transition-colors group">
                <div className="w-14 h-14 bg-green-soft rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🍱</div>
                <h3 className="font-display font-bold text-sm">Combo Meals</h3>
                <p className="text-ink-soft text-[10px] mt-0.5">{combos.length} ready meal{combos.length !== 1 ? "s" : ""}</p>
              </a>
              {buildPlate ? (
                <Link href={`/order/${buildPlate.dailyMenuId}`} className="bg-paper border-2 border-coral/20 rounded-2xl p-5 text-center hover:border-coral transition-colors group">
                  <div className="w-14 h-14 bg-red-soft rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🍛</div>
                  <h3 className="font-display font-bold text-sm">Build a Plate</h3>
                  <p className="text-ink-soft text-[10px] mt-0.5">From {formatNaira(buildPlate.minPrice)}</p>
                </Link>
              ) : (
                <div className="bg-paper border-2 border-line rounded-2xl p-5 text-center opacity-50">
                  <div className="w-14 h-14 bg-cream rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🍛</div>
                  <h3 className="font-display font-bold text-sm">Build a Plate</h3>
                  <p className="text-ink-soft text-[10px] mt-0.5">Not available today</p>
                </div>
              )}
            </div>

            {/* Combos */}
            <div id="combos">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-display font-bold text-lg">Combo Meals</h3>
                <span className="text-ink-soft text-xs">{combos.length} available</span>
              </div>
              <div className="space-y-3">
                {combos.map((meal) => {
                  const disabled = meal.expired || meal.remaining <= 0;
                  return (
                    <div key={meal.id} className={`bg-paper border rounded-2xl overflow-hidden transition-all hover:shadow-md ${meal.tag === "DEAL" ? "border-coral/30" : "border-line"}`}>
                      {meal.tag === "DEAL" && (
                        <div className="bg-coral/10 px-4 py-1">
                          <span className="text-[10px] font-extrabold text-coral uppercase">Special Deal</span>
                        </div>
                      )}
                      <div className="flex p-3 gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                          {meal.imageUrl ? (
                            <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between">
                              <h4 className="font-display font-bold text-sm leading-tight">{meal.name}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${meal.remaining > 0 ? "bg-green-soft text-green" : "bg-red-soft text-coral"}`}>
                                {meal.remaining > 0 ? `${meal.remaining} left` : "Sold out"}
                              </span>
                            </div>
                            {meal.description && <p className="text-ink-soft text-[11px] line-clamp-2 mt-0.5">{meal.description}</p>}
                          </div>
                          <div className="flex items-end justify-between mt-1.5">
                            <strong className="font-display font-bold">{formatNaira(meal.price)}</strong>
                            <Link
                              href={disabled ? "#" : `/order/${meal.id}`}
                              className={`inline-flex items-center gap-1.5 rounded-[10px] font-bold text-xs min-h-[36px] px-3 transition-all ${
                                disabled ? "bg-line text-ink-soft cursor-not-allowed opacity-50" : "bg-coral text-white shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038]"
                              }`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                              Add
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
