import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/grocery-items — public list of grocery products with subcategories
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
    },
    orderBy: [{ subcategory: "asc" }, { name: "asc" }],
  });

  const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))] as string[];

  return NextResponse.json({
    success: true,
    data: { products, subcategories },
  });
}
