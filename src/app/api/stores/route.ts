import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/delivery-fee";

// GET /api/stores?category=Food&lat=6.5&lng=3.3
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || undefined;
  const userLat = parseFloat(request.nextUrl.searchParams.get("lat") || "0");
  const userLng = parseFloat(request.nextUrl.searchParams.get("lng") || "0");
  const hasLocation = userLat !== 0 && userLng !== 0;

  // Include stores that have products OR meals (old restaurants have meals only)
  const where: Record<string, unknown> = {
    isActive: true,
    OR: [
      { products: { some: { isActive: true } } },
      { meals: { some: { isAvailable: true } } },
    ],
  };

  if (category && category !== "All") {
    // For category filter, only filter by products (meals don't have categories)
    // but still include meal-only restaurants under "Food"
    if (category === "Food") {
      where.OR = [
        { products: { some: { isActive: true, category } } },
        { meals: { some: { isAvailable: true } } },
      ];
    } else {
      where.OR = [{ products: { some: { isActive: true, category } } }];
    }
  }

  const stores = await prisma.restaurant.findMany({
    where,
    select: {
      id: true,
      name: true,
      address: true,
      imageUrl: true,
      bannerUrl: true,
      sortOrder: true,
      latitude: true,
      longitude: true,
      products: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
          retailPrice: true,
          groupPrice: true,
        },
      },
      meals: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        take: 5,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          price: true,
          originalPrice: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const data = stores.map((s) => {
    const relevant = (category && category !== "All")
      ? s.products.filter((p) => p.category === category)
      : s.products;

    const categories = [...new Set(s.products.map((p) => p.category))];
    // Add "Food" for meal-only restaurants
    if (s.meals.length > 0 && !categories.includes("Food")) categories.unshift("Food");

    const bestSaving = relevant.length > 0
      ? relevant.reduce((max, p) => {
          const pct = p.retailPrice > 0 ? Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100) : 0;
          return pct > max ? pct : max;
        }, 0)
      : s.meals.reduce((max, m) => {
          const pct = m.originalPrice && m.originalPrice > m.price ? Math.round(((m.originalPrice - m.price) / m.originalPrice) * 100) : 0;
          return pct > max ? pct : max;
        }, 0);

    // Cheapest item — from products or meals
    const cheapestProduct = relevant.length > 0
      ? relevant.reduce((min, p) => (p.retailPrice < min.retailPrice ? p : min))
      : null;
    const cheapestMeal = s.meals.length > 0
      ? s.meals.reduce((min, m) => (m.price < min.price ? m : min))
      : null;
    const lowestPrice = Math.min(
      cheapestProduct?.retailPrice ?? Infinity,
      cheapestMeal?.price ?? Infinity,
    );
    const lowestGroupPrice = Math.min(
      cheapestProduct?.groupPrice ?? Infinity,
      cheapestMeal?.price ?? Infinity,
    );

    // Hero image: products first, then meals, then banner
    const relevantImg = relevant.find((p) => p.imageUrl)?.imageUrl ?? null;
    const anyImg = s.products.find((p) => p.imageUrl)?.imageUrl ?? s.meals.find((m) => m.imageUrl)?.imageUrl ?? null;
    const heroImage = relevantImg || anyImg || s.bannerUrl;

    // Best deal from relevant products
    const bestDeal = relevant.reduce<{ name: string; saving: number } | null>((best, p) => {
      const sv = p.retailPrice > 0 ? Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100) : 0;
      if (!best || sv > best.saving) return { name: p.name, saving: sv };
      return best;
    }, null);

    // Top item names — from products or meals
    const topItems = relevant.length > 0
      ? relevant.slice(0, 3).map((p) => p.name.split(" ")[0])
      : s.meals.slice(0, 3).map((m) => m.name.split(" ")[0]);

    // Social proof — simulated from product count until real order data exists
    const ratingBase = [0, 4.8, 4.5, 4.9, 4.3, 4.7][s.sortOrder % 6] || 4.5;
    const orderBase = 0; // Real order count — will be populated from actual data

    // Distance from user
    const distanceKm = hasLocation && s.latitude && s.longitude
      ? haversineKm(s.latitude, s.longitude, userLat, userLng)
      : null;
    const walkMinutes = distanceKm !== null ? Math.round(distanceKm * 12) : null; // ~5km/h walking

    return {
      id: s.id,
      name: s.name,
      address: s.address,
      imageUrl: s.imageUrl,
      bannerUrl: s.bannerUrl,
      heroImage,
      productCount: relevant.length + s.meals.length,
      categories,
      bestSaving,
      lowestPrice,
      lowestGroupPrice,
      bestDealName: bestDeal?.name ?? null,
      topItems,
      distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
      walkMinutes,
      deliveryEstimate: walkMinutes !== null ? `${walkMinutes} min walk` : "Pickup nearby",
      rating: ratingBase,
      orderCount: orderBase,
    };
  });

  // Sort by distance if user has location, otherwise by sortOrder
  if (hasLocation) {
    data.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }

  const allCategories = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  return NextResponse.json({
    success: true,
    data,
    categories: allCategories.map((c) => c.category),
  });
}
