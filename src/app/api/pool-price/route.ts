import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePoolTiers, getPoolPrice } from "@/lib/pool-pricing";

/**
 * GET /api/pool-price?officeId=xxx&timeSlotId=yyy
 *
 * Returns the current pool price for every meal in today's menu
 * based on how many paid orders the office has in that time slot today.
 */
export async function GET(request: NextRequest) {
  try {
    const officeId = request.nextUrl.searchParams.get("officeId");
    const timeSlotId = request.nextUrl.searchParams.get("timeSlotId");

    if (!officeId || !timeSlotId) {
      return NextResponse.json({ success: true, data: { officeOrderCount: 0, meals: {} } });
    }

    // Count today's paid orders from this office in this time slot
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const officeOrderCount = await prisma.order.count({
      where: {
        officeId,
        paymentStatus: "SUCCESS",
        createdAt: { gte: todayStart, lte: todayEnd },
        dailyMenu: { timeSlotId },
      },
    });

    // Also count PENDING orders (people who've ordered but haven't paid yet — still counts towards social proof)
    const pendingCount = await prisma.order.count({
      where: {
        officeId,
        paymentStatus: "PENDING",
        createdAt: { gte: todayStart, lte: todayEnd },
        dailyMenu: { timeSlotId },
      },
    });

    // Use paid + pending for tier calculation (people have committed)
    const totalCommitted = officeOrderCount + pendingCount;

    // Get all meals for today's time slot that have pool tiers
    const todayStr = new Date().toLocaleDateString("en-CA");
    const today = new Date(todayStr + "T00:00:00.000Z");

    const dailyMenus = await prisma.dailyMenu.findMany({
      where: {
        date: today,
        timeSlotId,
        meal: { isAvailable: true },
      },
      include: { meal: true },
    });

    // Calculate pool price for each meal
    const meals: Record<string, {
      poolPrice: number;
      basePrice: number;
      savings: number;
      tierIndex: number;
      nextTier: { min: number; price: number } | null;
      tiers: { min: number; price: number }[];
    }> = {};

    for (const dm of dailyMenus) {
      const tiers = parsePoolTiers((dm.meal as Record<string, unknown>).poolTiers);
      if (tiers.length === 0) continue; // Skip meals without pool tiers

      const result = getPoolPrice(dm.meal.price, tiers, totalCommitted);
      meals[dm.id] = {
        poolPrice: result.price,
        basePrice: dm.meal.price,
        savings: result.savings,
        tierIndex: result.tierIndex,
        nextTier: result.nextTier,
        tiers,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        officeOrderCount: totalCommitted,
        meals,
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: { officeOrderCount: 0, meals: {} } });
  }
}
