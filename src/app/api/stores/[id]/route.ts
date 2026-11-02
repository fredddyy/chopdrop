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
    },
  });

  if (!store || !store.products.length) {
    return NextResponse.json(
      { success: false, error: "Store not found" },
      { status: 404 },
    );
  }

  const categories = [...new Set(store.products.map((p) => p.category))];

  return NextResponse.json({
    success: true,
    data: { ...store, categories },
  });
}
