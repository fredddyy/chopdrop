import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/restaurants/signals?officeId=xxx
 *
 * Returns per-restaurant trust signals:
 * - lastDeliveredMinAgo: minutes since last completed delivery today (or null)
 * - avgRating: average score from Rating model (or null)
 * - ratingCount: total number of ratings
 * - officeOrderCount: distinct users from this office who ordered from this restaurant today
 */
export async function GET(request: NextRequest) {
  try {
    const officeId = request.nextUrl.searchParams.get("officeId") || undefined;
    const todayStr = new Date().toLocaleDateString("en-CA");
    const todayStart = new Date(todayStr + "T00:00:00.000Z");
    const todayEnd = new Date(todayStr + "T23:59:59.999Z");

    // 1. Latest completed order per restaurant today
    const completedOrders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        paymentStatus: "SUCCESS",
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: {
        createdAt: true,
        dailyMenu: { select: { meal: { select: { restaurantId: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const lastDeliveredMap = new Map<string, Date>();
    for (const o of completedOrders) {
      const rId = o.dailyMenu.meal.restaurantId;
      if (!lastDeliveredMap.has(rId)) {
        lastDeliveredMap.set(rId, o.createdAt);
      }
    }

    // 2. Average ratings per restaurant (all time)
    const ratings = await prisma.rating.findMany({
      select: {
        score: true,
        order: { select: { dailyMenu: { select: { meal: { select: { restaurantId: true } } } } } },
      },
    });

    const ratingAgg = new Map<string, { total: number; count: number }>();
    for (const r of ratings) {
      const rId = r.order.dailyMenu.meal.restaurantId;
      const existing = ratingAgg.get(rId) || { total: 0, count: 0 };
      existing.total += r.score;
      existing.count += 1;
      ratingAgg.set(rId, existing);
    }

    // 3. Office order count per restaurant today
    const officeCountMap = new Map<string, number>();
    if (officeId) {
      const officeOrders = await prisma.order.findMany({
        where: {
          officeId,
          paymentStatus: "SUCCESS",
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        select: {
          customerName: true,
          dailyMenu: { select: { meal: { select: { restaurantId: true } } } },
        },
      });

      // Count distinct customers per restaurant
      const seen = new Map<string, Set<string>>();
      for (const o of officeOrders) {
        const rId = o.dailyMenu.meal.restaurantId;
        if (!seen.has(rId)) seen.set(rId, new Set());
        seen.get(rId)!.add(o.customerName);
      }
      for (const [rId, names] of seen) {
        officeCountMap.set(rId, names.size);
      }
    }

    // Collect all restaurant IDs
    const allIds = new Set([
      ...lastDeliveredMap.keys(),
      ...ratingAgg.keys(),
      ...officeCountMap.keys(),
    ]);

    const now = Date.now();
    const result: Record<string, {
      lastDeliveredMinAgo: number | null;
      avgRating: number | null;
      ratingCount: number;
      officeOrderCount: number;
    }> = {};

    for (const rId of allIds) {
      const lastDel = lastDeliveredMap.get(rId);
      const rating = ratingAgg.get(rId);
      result[rId] = {
        lastDeliveredMinAgo: lastDel ? Math.round((now - lastDel.getTime()) / 60000) : null,
        avgRating: rating ? Math.round((rating.total / rating.count) * 10) / 10 : null,
        ratingCount: rating?.count || 0,
        officeOrderCount: officeCountMap.get(rId) || 0,
      };
    }

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: true, data: {} });
  }
}
