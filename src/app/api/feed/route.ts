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
        select: { price: true },
        orderBy: { price: "asc" },
      },
      products: {
        where: { isActive: true, category: "Food" },
        take: 1,
        select: { groupPrice: true, retailPrice: true },
        orderBy: { groupPrice: "asc" },
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
    tiers: Array<{ min: number; discount: number }>;
  }> = [];

  for (const r of restaurants) {
    const tiers = parseGroupTiers(r.groupTiers);
    const cheapestMeal = r.meals[0]?.price ?? 0;
    const cheapestProduct = r.products[0]?.groupPrice ?? 0;
    const lowestPrice = cheapestProduct > 0 ? cheapestProduct : cheapestMeal;

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
        tiers,
      });
    }
  }

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
    },
  });
}
