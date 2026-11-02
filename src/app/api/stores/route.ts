import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stores?category=Food
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || undefined;

  const where: Record<string, unknown> = { isActive: true, products: { some: { isActive: true } } };

  if (category && category !== "All") {
    where.products = { some: { isActive: true, category } };
  }

  const stores = await prisma.restaurant.findMany({
    where,
    select: {
      id: true,
      name: true,
      address: true,
      imageUrl: true,
      bannerUrl: true,
      sortOrder: true,
      products: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
          retailPrice: true,
          groupPrice: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const data = stores.map((s) => {
    const categories = [...new Set(s.products.map((p) => p.category))];
    const bestSaving = s.products.reduce((max, p) => {
      const pct = p.retailPrice > 0 ? Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100) : 0;
      return pct > max ? pct : max;
    }, 0);
    const lowestPrice = Math.min(...s.products.map((p) => p.retailPrice));
    const previews = s.products
      .filter((p) => p.imageUrl)
      .slice(0, 4)
      .map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl }));

    return {
      id: s.id,
      name: s.name,
      address: s.address,
      imageUrl: s.imageUrl,
      bannerUrl: s.bannerUrl,
      productCount: s.products.length,
      categories,
      bestSaving,
      lowestPrice,
      previews,
    };
  });

  const allCategories = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  return NextResponse.json({
    success: true,
    data,
    categories: allCategories.map((c) => c.category),
  });
}
