import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const dailyMenus = await prisma.dailyMenu.findMany({
    where: {
      date: new Date(date),
      meal: { isAvailable: true },
    },
    include: {
      meal: {
        include: {
          restaurant: {
            include: {
              menuCategories: {
                include: { items: { orderBy: { sortOrder: "asc" } } },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      timeSlot: true,
    },
  });

  const items = dailyMenus.map((dm) => ({
    id: dm.id,
    date: dm.date,
    maxOrders: dm.maxOrders,
    currentOrders: dm.currentOrders,
    remaining: dm.maxOrders - dm.currentOrders,
    meal: {
      id: dm.meal.id,
      name: dm.meal.name,
      description: dm.meal.description,
      imageUrl: dm.meal.imageUrl,
      price: dm.meal.price,
      tag: dm.meal.tag,
      type: dm.meal.type,
    },
    restaurant: {
      id: dm.meal.restaurant.id,
      name: dm.meal.restaurant.name,
      address: dm.meal.restaurant.address,
      menuCategories:
        dm.meal.type === "BUILD_YOUR_PLATE"
          ? dm.meal.restaurant.menuCategories
          : undefined,
    },
    timeSlot: {
      id: dm.timeSlot.id,
      label: dm.timeSlot.label,
      startTime: dm.timeSlot.startTime,
      endTime: dm.timeSlot.endTime,
      cutoffTime: dm.timeSlot.cutoffTime,
    },
  }));

  return NextResponse.json({ success: true, data: items });
}
