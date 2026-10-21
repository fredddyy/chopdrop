import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const now = new Date();

  // Find the active promo that is within its date range
  const promo = await prisma.promo.findFirst({
    where: {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
    },
  });

  if (!promo) {
    return NextResponse.json({ success: true, data: null });
  }

  // Check if promo has ended
  if (promo.endDate && promo.endDate < now) {
    return NextResponse.json({ success: true, data: null });
  }

  // For GROUP_CASHBACK, count today's orders for the user's office
  let officeOrderCount = 0;
  const officeId = request.nextUrl.searchParams.get("officeId");

  if (promo.type === "GROUP_CASHBACK" && officeId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    officeOrderCount = await prisma.order.count({
      where: {
        officeId,
        paymentStatus: "SUCCESS",
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });
  }

  // For WEEKLY_LOYALTY, count this week's orders for the user
  let weeklyOrderCount = 0;
  const userId = request.nextUrl.searchParams.get("userId");

  if (promo.type === "WEEKLY_LOYALTY" && userId) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    weeklyOrderCount = await prisma.order.count({
      where: {
        userId,
        paymentStatus: "SUCCESS",
        createdAt: { gte: weekStart },
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: promo.id,
      name: promo.name,
      type: promo.type,
      rewardAmount: promo.rewardAmount,
      rewardType: promo.rewardType,
      minOrders: promo.minOrders,
      cutoffTime: promo.cutoffTime,
      description: promo.description,
      imageUrl: promo.imageUrl,
      officeOnly: promo.officeOnly,
      progress: {
        officeOrderCount,
        weeklyOrderCount,
      },
    },
  });
}
