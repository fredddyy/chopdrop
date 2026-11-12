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

  // Query real order counts per restaurant
  const orderCounts = await prisma.order.groupBy({
    by: ["dailyMenuId"],
    where: { paymentStatus: "SUCCESS" },
    _count: true,
  });
  // Map dailyMenu → restaurant via meal
  const menuToRestaurant = new Map<string, string>();
  const dailyMenus = await prisma.dailyMenu.findMany({
    select: { id: true, meal: { select: { restaurantId: true } } },
  });
  for (const dm of dailyMenus) menuToRestaurant.set(dm.id, dm.meal.restaurantId);

  const restaurantOrderCounts = new Map<string, number>();
  for (const oc of orderCounts) {
    const rid = menuToRestaurant.get(oc.dailyMenuId);
    if (rid) restaurantOrderCounts.set(rid, (restaurantOrderCounts.get(rid) || 0) + oc._count);
  }

  // Also count group order members per restaurant
  const groupOrderCounts = await prisma.groupOrderMember.groupBy({
    by: ["groupOrderId"],
    where: { paymentStatus: "SUCCESS" },
    _count: true,
  });
  const goToRestaurant = new Map<string, string>();
  const groupOrders = await prisma.groupOrder.findMany({
    select: { id: true, restaurantId: true },
  });
  for (const go of groupOrders) goToRestaurant.set(go.id, go.restaurantId);
  for (const gc of groupOrderCounts) {
    const rid = goToRestaurant.get(gc.groupOrderId);
    if (rid) restaurantOrderCounts.set(rid, (restaurantOrderCounts.get(rid) || 0) + gc._count);
  }

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
    const rawLowestPrice = Math.min(
      cheapestProduct?.retailPrice ?? Infinity,
      cheapestMeal?.originalPrice ?? cheapestMeal?.price ?? Infinity,
    );
    const rawLowestGroupPrice = Math.min(
      cheapestProduct?.groupPrice ?? Infinity,
      cheapestMeal?.price ?? Infinity,
    );
    const lowestPrice = rawLowestPrice === Infinity ? 0 : rawLowestPrice;
    const lowestGroupPrice = rawLowestGroupPrice === Infinity ? 0 : rawLowestGroupPrice;

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

    // Social proof
    const ratingBase = [0, 4.8, 4.5, 4.9, 4.3, 4.7][s.sortOrder % 6] || 4.5;
    const orderBase = restaurantOrderCounts.get(s.id) || 0;

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
      deliveryEstimate: walkMinutes !== null ? `${Math.max(10, Math.round(walkMinutes * 0.7))} min delivery` : "Pickup available",
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
