"use client";

import { useState, useEffect } from "react";
import { formatNaira } from "@/lib/utils";
import { getCustomerProfile, saveCustomerProfile } from "@/lib/customer";
import Link from "next/link";

interface MenuItemData {
  id: string;
  name: string;
  price: number;
}

interface MenuCategoryData {
  id: string;
  name: string;
  selectionRule: string;
  items: MenuItemData[];
}

interface DailyMenuData {
  id: string;
  meal: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    type: string;
    tag: string;
  };
  restaurant: {
    name: string;
    address: string;
    menuCategories: MenuCategoryData[];
  };
  timeSlot: {
    startTime: string;
    endTime: string;
    cutoffTime: string;
  };
  remaining: number;
}

interface OrderFormProps {
  dailyMenu: DailyMenuData;
}

export function OrderForm({ dailyMenu }: OrderFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBuildPlate = dailyMenu.meal.type === "BUILD_YOUR_PLATE";

  // Auto-fill from saved profile
  useEffect(() => {
    const profile = getCustomerProfile();
    if (profile) {
      setCustomerName(profile.name);
      setCustomerPhone(profile.phone);
      setCustomerEmail(profile.email);
      setDeliveryAddress(profile.deliveryAddress);
      setFulfillmentType(profile.preferredFulfillment);
    }
  }, []);

  function handleItemToggle(categoryId: string, itemId: string, rule: string) {
    setSelectedItems((prev) => {
      const current = prev[categoryId] || [];
      if (rule === "PICK_ONE") return { ...prev, [categoryId]: [itemId] };
      if (current.includes(itemId)) return { ...prev, [categoryId]: current.filter((id) => id !== itemId) };
      return { ...prev, [categoryId]: [...current, itemId] };
    });
  }

  function calculateTotal(): number {
    if (!isBuildPlate) return dailyMenu.meal.price * quantity;
    let total = 0;
    for (const category of dailyMenu.restaurant.menuCategories) {
      const selected = selectedItems[category.id] || [];
      for (const itemId of selected) {
        const item = category.items.find((i) => i.id === itemId);
        if (item) total += item.price;
      }
    }
    return total * quantity;
  }

  function validateBuildPlate(): string | null {
    const totalSelected = Object.values(selectedItems).flat().length;
    if (totalSelected === 0) return "Please pick at least one item";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) { setError("Name and phone number are required"); return; }
    if (fulfillmentType === "DELIVERY" && !deliveryAddress.trim()) { setError("Please enter your delivery address"); return; }
    if (isBuildPlate) { const v = validateBuildPlate(); if (v) { setError(v); return; } }

    setLoading(true);

    // Save profile for next time
    saveCustomerProfile({
      name: customerName.trim(),
      phone: customerPhone.trim(),
      email: customerEmail.trim(),
      deliveryAddress: deliveryAddress.trim(),
      preferredFulfillment: fulfillmentType,
    });

    const items = isBuildPlate
      ? Object.values(selectedItems).flat().map((menuItemId) => ({ menuItemId, quantity: 1 }))
      : undefined;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyMenuId: dailyMenu.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          fulfillmentType,
          deliveryAddress: fulfillmentType === "DELIVERY" ? deliveryAddress.trim() : undefined,
          quantity,
          items,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Something went wrong"); setLoading(false); return; }
      window.location.href = data.data.authorizationUrl;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const total = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link href="/menu" className="inline-flex items-center gap-1.5 text-ink-soft text-sm font-semibold mb-5 hover:text-ink transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 19l-7-7 7-7" />
        </svg>
        Back to menu
      </Link>

      {/* Meal Header */}
      <div className="bg-paper border border-line rounded-[16px] p-5 mb-4 flex items-center gap-4">
        {dailyMenu.meal.imageUrl && (
          <img src={dailyMenu.meal.imageUrl} alt={dailyMenu.meal.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-coral text-[9px] font-extrabold uppercase tracking-[0.08em]">
            {dailyMenu.restaurant.name}
          </div>
          <h1 className="font-display font-bold text-xl tracking-[-0.025em] mt-0.5">
            {isBuildPlate ? `Build your ${dailyMenu.meal.name.toLowerCase().replace("build your plate", "box")}` : dailyMenu.meal.name}
          </h1>
          {dailyMenu.meal.description && (
            <p className="text-ink-soft text-xs mt-0.5">{dailyMenu.meal.description}</p>
          )}
        </div>
        {!isBuildPlate && (
          <strong className="font-display font-bold text-xl flex-shrink-0">
            {formatNaira(dailyMenu.meal.price)}
          </strong>
        )}
      </div>

      {/* Build Your Plate Steps */}
      {isBuildPlate && (
        <div className="space-y-5 mb-5">
          {dailyMenu.restaurant.menuCategories.map((category, idx) => (
            <div key={category.id} className="bg-paper border border-line rounded-[16px] p-5">
              {/* Step header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-green rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <strong className="font-display font-bold text-[15px]">
                    {category.selectionRule === "PICK_ONE" ? `Choose your ${category.name.toLowerCase()}`
                      : category.selectionRule === "PICK_ONE_OR_MORE" ? `Choose your ${category.name.toLowerCase()}`
                      : `Add ${category.name.toLowerCase()}`}
                  </strong>
                </div>
                <span className="bg-cream text-ink-soft text-[9px] font-extrabold uppercase tracking-[0.07em] px-2 py-1 rounded-full">
                  {category.selectionRule === "PICK_ANY" ? "Optional" : `Required · Pick ${category.selectionRule === "PICK_ONE" ? "1" : "1+"}`}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {category.items.map((item) => {
                  const isSelected = (selectedItems[category.id] || []).includes(item.id);
                  const isRadio = category.selectionRule === "PICK_ONE";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemToggle(category.id, item.id, category.selectionRule)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-[11px] border transition-all text-left ${
                        isSelected
                          ? "border-2 border-green bg-green-soft"
                          : "border border-line hover:border-ink-soft/30"
                      }`}
                    >
                      {/* Radio / Checkbox indicator */}
                      <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "border-green" : "border-ink-soft/40"
                      } ${!isRadio ? "rounded-[5px]" : ""}`}>
                        {isSelected && (
                          isRadio ? (
                            <div className="w-[9px] h-[9px] bg-green rounded-full" />
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green">
                              <path d="m5 12 4 4L19 6" />
                            </svg>
                          )
                        )}
                      </div>

                      {/* Name + note */}
                      <div className="flex-1 min-w-0">
                        <strong className="block text-[13px]">{item.name}</strong>
                      </div>

                      {/* Price */}
                      <span className="text-[12px] font-bold text-ink-soft flex-shrink-0">
                        +{formatNaira(item.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Already included note */}
          <div className="flex items-center gap-2 px-4 py-3 bg-cream rounded-[10px] text-ink-soft text-[11px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green flex-shrink-0">
              <path d="m5 12 4 4L19 6" />
            </svg>
            <span>
              <strong className="text-ink">Already included</strong> — base items come with every box.
            </span>
          </div>
        </div>
      )}

      {/* Customer Details */}
      <div className="bg-paper border border-line rounded-[16px] p-5 mb-4 space-y-4">
        <div className="font-display font-bold text-[15px] pb-2 border-b border-line">Your details</div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Your Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Amaka Okoro"
            className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green/50"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="0803 456 7890"
            className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green/50"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">
            Email <span className="font-normal">(optional)</span>
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="amaka@email.com"
            className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green/50"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Quantity</label>
          <div className="flex items-center border border-line rounded-[9px] w-fit">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-cream transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
            </button>
            <strong className="w-7 text-center text-sm">{quantity}</strong>
            <button type="button" onClick={() => setQuantity(Math.min(dailyMenu.remaining, quantity + 1))} className="w-9 h-9 flex items-center justify-center hover:bg-cream transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>

        {/* Fulfillment */}
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Collection</label>
          <div className="flex gap-2">
            {(["PICKUP", "DELIVERY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFulfillmentType(type)}
                className={`flex-1 py-2.5 rounded-[10px] border text-sm font-semibold transition-all ${
                  fulfillmentType === type
                    ? "border-green bg-green-soft text-green"
                    : "border-line text-ink-soft hover:border-ink-soft/30"
                }`}
              >
                {type === "PICKUP" ? "Pickup" : "Delivery"}
              </button>
            ))}
          </div>
        </div>

        {fulfillmentType === "DELIVERY" && (
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">Delivery Address</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="8th floor, Northcourt, Alausa"
              className="w-full px-3.5 py-2.5 border border-line rounded-[10px] text-sm bg-cream/50 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green/50"
              required
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-soft text-coral text-sm p-3.5 rounded-[10px] mb-4 font-semibold">
          {error}
        </div>
      )}

      {/* Sticky Footer — Total + Pay */}
      <div className="sticky bottom-0 bg-paper border-t border-line -mx-4 px-4 py-4 mt-4 rounded-t-[16px] shadow-[0_-8px_22px_rgba(25,52,45,0.05)]">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <span className="text-ink-soft text-[10px] font-semibold block">Total</span>
            <strong className="font-display font-[750] text-[22px] tracking-[-0.03em]">
              {formatNaira(total)}
            </strong>
          </div>
          <button
            type="submit"
            disabled={loading || total === 0}
            className="bg-coral text-white font-bold px-6 py-3 rounded-[10px] text-sm inline-flex items-center gap-2 shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Processing..." : isBuildPlate ? "Add to box" : "Pay with Paystack"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
