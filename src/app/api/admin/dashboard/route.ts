import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: today },
      paymentStatus: "SUCCESS",
    },
    include: {
      dailyMenu: {
        include: {
          meal: { include: { restaurant: true } },
        },
      },
    },
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Group by restaurant
  const byRestaurant: Record<string, { name: string; orders: number; revenue: number }> = {};
  for (const order of orders) {
    const rName = order.dailyMenu.meal.restaurant.name;
    if (!byRestaurant[rName]) {
      byRestaurant[rName] = { name: rName, orders: 0, revenue: 0 };
    }
    byRestaurant[rName].orders += order.quantity;
    byRestaurant[rName].revenue += order.totalAmount;
  }

  // Group by meal
  const byMeal: Record<string, { name: string; count: number }> = {};
  for (const order of orders) {
    const mName = order.dailyMenu.meal.name;
    if (!byMeal[mName]) {
      byMeal[mName] = { name: mName, count: 0 };
    }
    byMeal[mName].count += order.quantity;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const order of orders) {
    byStatus[order.status] = (byStatus[order.status] || 0) + 1;
  }

  return NextResponse.json({
    success: true,
    data: {
      totalOrders,
      totalRevenue,
      byRestaurant: Object.values(byRestaurant),
      byMeal: Object.values(byMeal),
      byStatus,
    },
  });
}
