import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/[id] — public product detail
// Checks Product table first, falls back to Meal table for old-style items
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try Product table first
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true, imageUrl: true, address: true, latitude: true, longitude: true } },
    },
  });

  if (product) {
    return NextResponse.json({ success: true, data: product });
  }

  // Fall back to Meal table (old-style combos/menu items)
  const meal = await prisma.meal.findUnique({
    where: { id },
    include: {
      restaurant: { select: { id: true, name: true, imageUrl: true, address: true, latitude: true, longitude: true } },
    },
  });

  if (meal) {
    // Map Meal to Product-like shape for the frontend
    return NextResponse.json({
      success: true,
      data: {
        id: meal.id,
        name: meal.name,
        description: meal.description,
        imageUrl: meal.imageUrl,
        category: "Combos",
        subcategory: null,
        retailPrice: meal.originalPrice || meal.price,
        groupPrice: meal.price,
        minPoolSize: 10,
        poolTiers: meal.poolTiers,
        maxQuantity: meal.maxDeals,
        tags: meal.tag,
        vendor: meal.restaurant,
      },
    });
  }

  return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
}
