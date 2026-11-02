import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products?category=Food&search=jollof&page=1&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isActive: true, vendor: { isActive: true } };
  if (category && category !== "All") where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { subcategory: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
      { vendor: { is: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { vendor: { select: { id: true, name: true, imageUrl: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Get distinct categories for filter bar
  const categories = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  return NextResponse.json({
    success: true,
    data: products,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    categories: categories.map(c => c.category),
  });
}
