import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/fix-product?url=<image_url> — update Chicken Republic product image
// Also makes it the first product (lowest sortOrder) so it shows as featured
// Hit once then delete this file
export async function GET(request: NextRequest) {
  const productId = "cmw4mgx8u00007kwsf2148o5";
  const url = request.nextUrl.searchParams.get("url");

  // Better sandwich image from Unsplash if no URL provided
  const imageUrl = url || "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&h=600&fit=crop&q=90";

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        imageUrl,
        sortOrder: -100, // Ensures it appears first in any query
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Product not found" });
  }

  return NextResponse.json({ success: true, imageUrl, message: "Product image + sort updated" });
}
