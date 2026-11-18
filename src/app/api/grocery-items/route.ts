import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/grocery-items — public list of grocery products with subcategories + stores
export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true, category: "Groceries" },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      subcategory: true,
      retailPrice: true,
      groupPrice: true,
      vendor: { select: { id: true, name: true, imageUrl: true, bannerUrl: true, address: true } },
    },
    orderBy: [{ subcategory: "asc" }, { name: "asc" }],
  });

  const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))] as string[];

  // Get unique grocery stores
  const storeMap = new Map<string, { id: string; name: string; imageUrl: string | null; bannerUrl: string | null; address: string; itemCount: number }>();
  for (const p of products) {
    if (!storeMap.has(p.vendor.id)) {
      storeMap.set(p.vendor.id, { ...p.vendor, itemCount: 0 });
    }
    storeMap.get(p.vendor.id)!.itemCount++;
  }

  return NextResponse.json({
    success: true,
    data: {
      products: products.map(p => ({ ...p, vendorId: p.vendor.id, vendorName: p.vendor.name })),
      subcategories,
      stores: Array.from(storeMap.values()),
    },
  });
}
