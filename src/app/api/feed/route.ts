import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGroupTiers, getGroupDiscount } from "@/lib/group-tier-pricing";

// GET /api/feed — home feed: restaurants with active group orders + inactive restaurants
export async function GET() {
  const now = new Date();

  // Fetch all active restaurants with their group orders and basic info
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      address: true,
      imageUrl: true,
      bannerUrl: true,
      groupTiers: true,
      sortOrder: true,
      groupOrders: {
        where: {
          status: "OPEN",
          deadline: { gt: now },
        },
        orderBy: { createdAt: "desc" },
        take: 1, // latest active order per restaurant
        select: {
          id: true,
          inviteCode: true,
          deadline: true,
          status: true,
          deliveryAddress: true,
          createdAt: true,
          coordinator: {
            select: { firstName: true },
          },
          members: {
            select: {
              userId: true,
              subtotal: true,
              paymentStatus: true,
              createdAt: true,
              user: {
                select: { firstName: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      meals: {
        where: { isAvailable: true },
        take: 1,
        select: { name: true, price: true },
        orderBy: { price: "asc" },
      },
      products: {
        where: { isActive: true, category: "Food" },
        take: 1,
        select: { name: true, groupPrice: true, retailPrice: true },
        orderBy: { groupPrice: "asc" },
      },
      _count: {
        select: { products: { where: { isActive: true, category: "Food" } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const activeOrders: Array<{
    restaurantId: string;
    restaurantName: string;
    restaurantImage: string | null;
    restaurantBanner: string | null;
    restaurantAddress: string;
    groupOrderId: string;
    inviteCode: string;
    deadline: string;
    coordinatorName: string;
    memberCount: number;
    memberNames: string[];
    paidMemberCount: number;
    tiers: Array<{ min: number; discount: number }>;
    currentDiscount: number;
    currentTierIndex: number;
    nextTier: { min: number; discount: number } | null;
    spotsToNextTier: number;
    lowestPrice: number;
    createdAt: string;
  }> = [];

  const inactiveRestaurants: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    bannerUrl: string | null;
    address: string;
    lowestPrice: number;
    lowestRetailPrice: number;
    cheapestItemName: string | null;
    hasBanner: boolean;
    rating: number;
    tiers: Array<{ min: number; discount: number }>;
    recentOrderCount: number;
    recentOrderNames: string[];
    groupDealCount: number;
  }> = [];

  // Query recent group order activity per restaurant (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentGroupOrders = await prisma.groupOrder.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: {
      restaurantId: true,
      members: {
        where: { paymentStatus: "SUCCESS" },
        select: { user: { select: { firstName: true } } },
        take: 5,
      },
    },
  });
  const recentActivity = new Map<string, { count: number; names: string[] }>();
  for (const go of recentGroupOrders) {
    const existing = recentActivity.get(go.restaurantId) || { count: 0, names: [] };
    existing.count += go.members.length;
    for (const m of go.members) {
      if (existing.names.length < 5 && !existing.names.includes(m.user.firstName)) {
        existing.names.push(m.user.firstName);
      }
    }
    recentActivity.set(go.restaurantId, existing);
  }

  // Also count legacy orders per restaurant (from Order model)
  const recentLegacyOrders = await prisma.order.findMany({
    where: { createdAt: { gte: sevenDaysAgo }, paymentStatus: "SUCCESS" },
    select: {
      dailyMenu: { select: { meal: { select: { restaurantId: true } } } },
      customerName: true,
    },
  });
  for (const o of recentLegacyOrders) {
    const rid = o.dailyMenu.meal.restaurantId;
    const existing = recentActivity.get(rid) || { count: 0, names: [] };
    existing.count += 1;
    const firstName = o.customerName.split(" ")[0];
    if (existing.names.length < 5 && !existing.names.includes(firstName)) {
      existing.names.push(firstName);
    }
    recentActivity.set(rid, existing);
  }

  for (const r of restaurants) {
    const tiers = parseGroupTiers(r.groupTiers);
    const cheapestMeal = r.meals[0]?.price ?? 0;
    const cheapestProduct = r.products[0]?.groupPrice ?? 0;
    const cheapestRetail = r.products[0]?.retailPrice ?? 0;
    const prices = [cheapestMeal, cheapestProduct].filter(p => p > 0);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    // Only show retail price story when products have actual group discount
    const lowestRetailPrice = cheapestRetail > 0 && cheapestRetail > cheapestProduct ? cheapestRetail : 0;
    // Cheapest item name for price context
    const cheapestItemName = cheapestProduct > 0 && cheapestProduct <= cheapestMeal
      ? r.products[0]?.name ?? null
      : r.meals[0]?.name ?? null;

    const activeOrder = r.groupOrders[0];
    if (activeOrder) {
      const paidMembers = activeOrder.members.filter(m => m.paymentStatus === "SUCCESS");
      const allMembers = activeOrder.members;
      const { discount, tierIndex, nextTier } = getGroupDiscount(tiers, paidMembers.length);

      activeOrders.push({
        restaurantId: r.id,
        restaurantName: r.name,
        restaurantImage: r.imageUrl,
        restaurantBanner: r.bannerUrl,
        restaurantAddress: r.address,
        groupOrderId: activeOrder.id,
        inviteCode: activeOrder.inviteCode,
        deadline: activeOrder.deadline.toISOString(),
        coordinatorName: activeOrder.coordinator.firstName,
        memberCount: allMembers.length,
        memberNames: allMembers.slice(0, 5).map(m => m.user.firstName),
        paidMemberCount: paidMembers.length,
        tiers,
        currentDiscount: discount,
        currentTierIndex: tierIndex,
        nextTier,
        spotsToNextTier: nextTier ? Math.max(0, nextTier.min - paidMembers.length) : 0,
        lowestPrice,
        createdAt: activeOrder.createdAt.toISOString(),
      });
    } else {
      inactiveRestaurants.push({
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
        bannerUrl: r.bannerUrl,
        address: r.address,
        lowestPrice,
        lowestRetailPrice,
        cheapestItemName,
        hasBanner: !!r.bannerUrl,
        rating: 0, // Real ratings — will be populated from actual review data
        recentOrderCount: recentActivity.get(r.id)?.count ?? 0,
        recentOrderNames: recentActivity.get(r.id)?.names ?? [],
        groupDealCount: r._count.products,
        tiers,
      });
    }
  }

  // Sort inactive: restaurants with banners first (better visual), then by sortOrder
  inactiveRestaurants.sort((a, b) => {
    if (a.hasBanner && !b.hasBanner) return -1;
    if (!a.hasBanner && b.hasBanner) return 1;
    return 0;
  });

  // Sort active orders: most members first (most social), then by deadline (most urgent)
  activeOrders.sort((a, b) => {
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return NextResponse.json({
    success: true,
    data: {
      activeOrders,
      inactiveRestaurants,
      totalActive: activeOrders.length,
      weeklyOrderCount: Array.from(recentActivity.values()).reduce((s, a) => s + a.count, 0),
    },
  });
}
