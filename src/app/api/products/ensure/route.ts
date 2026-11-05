import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/products/ensure — given any item ID (Product, Meal, or MenuItem),
// ensure a Product record exists for pool creation. Returns the Product ID.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { itemId } = body;

  if (!itemId) {
    return NextResponse.json({ success: false, error: "itemId required" }, { status: 400 });
  }

  // 1. Already a Product? Return it.
  const existing = await prisma.product.findUnique({ where: { id: itemId } });
  if (existing) {
    return NextResponse.json({ success: true, data: { productId: existing.id } });
  }

  // 2. Is it a Meal? Create a Product from it.
  const meal = await prisma.meal.findUnique({
    where: { id: itemId },
    include: { restaurant: { select: { id: true } } },
  });
  if (meal) {
    const product = await prisma.product.create({
      data: {
        id: meal.id, // reuse same ID so links still work
        vendorId: meal.restaurant.id,
        name: meal.name,
        description: meal.description,
        imageUrl: meal.imageUrl,
        category: "Food",
        subcategory: "Combos",
        retailPrice: meal.originalPrice || meal.price,
        groupPrice: meal.price,
        minPoolSize: 10,
        poolTiers: meal.poolTiers ?? undefined,
        maxQuantity: meal.maxDeals,
      },
    });
    return NextResponse.json({ success: true, data: { productId: product.id } });
  }

  // 3. Is it a MenuItem? Create a Product from it.
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { category: { select: { restaurantId: true, name: true } } },
  });
  if (menuItem) {
    const product = await prisma.product.create({
      data: {
        id: menuItem.id, // reuse same ID
        vendorId: menuItem.category.restaurantId,
        name: menuItem.name,
        description: menuItem.description,
        imageUrl: menuItem.imageUrl,
        category: "Food",
        subcategory: menuItem.category.name,
        retailPrice: menuItem.price,
        groupPrice: menuItem.price, // same price — beg price will reduce it
        minPoolSize: 10,
      },
    });
    return NextResponse.json({ success: true, data: { productId: product.id } });
  }

  return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
}
