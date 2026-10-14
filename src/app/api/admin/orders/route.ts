import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    createdAt: { gte: startOfDay, lte: endOfDay },
  };

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        dailyMenu: {
          include: {
            meal: { include: { restaurant: true } },
            timeSlot: true,
          },
        },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: orders,
    meta: { total, page, limit },
  });
}
