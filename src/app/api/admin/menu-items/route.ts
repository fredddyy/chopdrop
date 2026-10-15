import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — list all categories + items for a restaurant
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    // Return all restaurants with their categories and item counts
    const restaurants = await prisma.restaurant.findMany({
      include: {
        menuCategories: {
          include: { items: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: restaurants });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menuCategories: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ success: true, data: restaurant });
}

// POST — create a new menu item
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { categoryId, name, price, sortOrder } = body;

  if (!categoryId || !name || price === undefined) {
    return NextResponse.json(
      { success: false, error: "categoryId, name, and price are required" },
      { status: 400 }
    );
  }

  const item = await prisma.menuItem.create({
    data: {
      categoryId,
      name: name.trim(),
      price: Math.round(price),
      sortOrder: sortOrder || 0,
    },
  });

  return NextResponse.json({ success: true, data: item });
}
