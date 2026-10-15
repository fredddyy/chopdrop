import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  const dropPoints = await prisma.dropPoint.findMany({
    where: { isActive: true },
  });

  const active = [];
  for (const dp of dropPoints) {
    const orderCount = await prisma.order.count({
      where: { dropPointId: dp.id, createdAt: { gte: today } },
    });
    if (orderCount > 0) {
      active.push({
        id: dp.id,
        name: dp.name,
        address: dp.address,
        todayOrders: orderCount,
        isFreeDelivery: orderCount >= 2,
      });
    }
  }

  active.sort((a, b) => b.todayOrders - a.todayOrders);

  return NextResponse.json({ success: true, data: active });
}
