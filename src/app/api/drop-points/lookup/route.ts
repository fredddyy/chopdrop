import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Find drop points matching the query (case-insensitive contains)
  const dropPoints = await prisma.dropPoint.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
  });

  // Get today's order count for each drop point
  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  const results = await Promise.all(
    dropPoints.map(async (dp) => {
      const orderCount = await prisma.order.count({
        where: {
          dropPointId: dp.id,
          createdAt: { gte: today },
        },
      });
      return {
        id: dp.id,
        name: dp.name,
        address: dp.address,
        tier: dp.tier,
        todayOrders: orderCount,
        isFreeDelivery: orderCount >= 2, // 3+ including this user = free
      };
    })
  );

  return NextResponse.json({ success: true, data: results });
}
