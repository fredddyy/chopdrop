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
    // When category is filtered, compute card data from matching products only
    const relevant = (category && category !== "All")
      ? s.products.filter((p) => p.category === category)
      : s.products;

    const categories = [...new Set(s.products.map((p) => p.category))];
    const bestSaving = relevant.reduce((max, p) => {
      const pct = p.retailPrice > 0 ? Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100) : 0;
      return pct > max ? pct : max;
    }, 0);
    // Cheapest product for two-price display
    const cheapest = (relevant.length > 0 ? relevant : s.products)
      .reduce((min, p) => (p.retailPrice < min.retailPrice ? p : min));
    const lowestPrice = cheapest.retailPrice;
    const lowestGroupPrice = cheapest.groupPrice;

    // Hero image: from the category-relevant products first
    const relevantImg = relevant.find((p) => p.imageUrl)?.imageUrl ?? null;
    const anyImg = s.products.find((p) => p.imageUrl)?.imageUrl ?? null;
    const heroImage = relevantImg || anyImg || s.bannerUrl;

    // Best deal from relevant products
    const bestDeal = relevant.reduce<{ name: string; saving: number } | null>((best, p) => {
      const sv = p.retailPrice > 0 ? Math.round(((p.retailPrice - p.groupPrice) / p.retailPrice) * 100) : 0;
      if (!best || sv > best.saving) return { name: p.name, saving: sv };
      return best;
    }, null);

    // Top product names from relevant products
    const topItems = relevant.slice(0, 3).map((p) => p.name.split(" ")[0]);

    return {
      id: s.id,
      name: s.name,
      address: s.address,
      imageUrl: s.imageUrl,
      bannerUrl: s.bannerUrl,
      heroImage,
      productCount: relevant.length,
      categories,
      bestSaving,
      lowestPrice,
      lowestGroupPrice,
      bestDealName: bestDeal?.name ?? null,
      topItems,
      // Vary delivery estimate by store sort order for realism
      deliveryEstimate: [null, "20–35 min", "25–40 min", "30–45 min", "35–50 min"][s.sortOrder % 5] || "30–45 min",
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
