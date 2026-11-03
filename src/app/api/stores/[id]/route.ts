import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stores/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const store = await prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      imageUrl: true,
      bannerUrl: true,
      products: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          category: true,
          subcategory: true,
          retailPrice: true,
          groupPrice: true,
          minPoolSize: true,
          tags: true,
        },
      },
      meals: {
        where: { isAvailable: true },
        orderBy: [{ sortOrder: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          originalPrice: true,
          tag: true,
          type: true,
          poolTiers: true,
        },
      },
      menuCategories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!store) {
    return NextResponse.json(
      { success: false, error: "Store not found" },
      { status: 404 },
    );
  }

  // Don't 404 if store has meals but no products — old restaurants have meals only
  if (!store.products.length && !store.meals.length) {
    return NextResponse.json(
      { success: false, error: "Store not found" },
      { status: 404 },
    );
  }

  const productCategories = [...new Set(store.products.map((p) => p.category))];

  // Separate combo meals (poolable) from regular meals
  const combos = store.meals
    .filter((m) => m.type === "FIXED")
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      imageUrl: m.imageUrl,
      price: m.price,
      originalPrice: m.originalPrice,
      tag: m.tag,
      poolTiers: m.poolTiers,
      type: "combo" as const,
    }));

  // Menu categories with items (for individual ordering)
  const menuCategories = store.menuCategories
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items,
    }));

  return NextResponse.json({
    success: true,
    data: {
      ...store,
      categories: productCategories,
      combos,
      menuCategories,
    },
  });
}
