import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/products — list all products
export async function GET() {
  const products = await prisma.product.findMany({
    include: { vendor: { select: { id: true, name: true, imageUrl: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ success: true, data: products });
}

// POST /api/admin/products — create a product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, name, description, imageUrl, category, subcategory, retailPrice, groupPrice, minPoolSize, poolTiers, maxQuantity, tags, sortOrder } = body;

    if (!vendorId || !name || !retailPrice || !groupPrice) {
      return NextResponse.json({ success: false, error: "vendorId, name, retailPrice, and groupPrice are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        vendorId,
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        category: category || "Food",
        subcategory: subcategory || null,
        retailPrice: Math.round(Number(retailPrice) * 100), // convert naira to kobo
        groupPrice: Math.round(Number(groupPrice) * 100),
        minPoolSize: minPoolSize || 10,
        poolTiers: poolTiers || null,
        maxQuantity: maxQuantity || 100,
        tags: tags || null,
        sortOrder: sortOrder || 0,
      },
      include: { vendor: { select: { id: true, name: true, imageUrl: true } } },
    });

    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}
