import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cleanup — list all products + restaurants (dry run)
// GET /api/cleanup?run=true — delete fake products (unsplash images) and empty restaurants
export async function GET(request: NextRequest) {
  const run = request.nextUrl.searchParams.get("run") === "true";

  // Find all products
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, imageUrl: true, vendorId: true, vendor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Fake = has unsplash URL
  const fakeProducts = allProducts.filter((p) => p.imageUrl?.includes("unsplash.com"));
  const realProducts = allProducts.filter((p) => !p.imageUrl?.includes("unsplash.com"));

  if (!run) {
    // Dry run — show what would be deleted
    return NextResponse.json({
      success: true,
      dryRun: true,
      message: "Add ?run=true to actually delete",
      fakeProducts: fakeProducts.map((p) => ({ id: p.id, name: p.name, vendor: p.vendor.name })),
      realProducts: realProducts.map((p) => ({ id: p.id, name: p.name, vendor: p.vendor.name })),
      fakeCount: fakeProducts.length,
      realCount: realProducts.length,
    });
  }

  // Delete fake products (and their pool members first)
  for (const p of fakeProducts) {
    // Delete pool members for any pools of this product
    const pools = await prisma.pool.findMany({ where: { productId: p.id }, select: { id: true } });
    for (const pool of pools) {
      await prisma.poolMember.deleteMany({ where: { poolId: pool.id } });
    }
    await prisma.pool.deleteMany({ where: { productId: p.id } });
    await prisma.product.delete({ where: { id: p.id } });
  }

  // Find restaurants with no products, meals, or menu categories left
  const allRestaurants = await prisma.restaurant.findMany({
    select: {
      id: true, name: true,
      _count: { select: { products: true, meals: true, menuCategories: true } },
    },
  });
  const emptyRestaurants = allRestaurants.filter(
    (r) => r._count.products === 0 && r._count.meals === 0 && r._count.menuCategories === 0,
  );

  // Delete empty restaurants
  for (const r of emptyRestaurants) {
    await prisma.restaurant.delete({ where: { id: r.id } });
  }

  return NextResponse.json({
    success: true,
    deleted: {
      products: fakeProducts.length,
      emptyRestaurants: emptyRestaurants.map((r) => r.name),
    },
    remaining: {
      products: realProducts.length,
      restaurants: allRestaurants.length - emptyRestaurants.length,
    },
  });
}
