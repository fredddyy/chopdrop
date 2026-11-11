import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

// POST /api/demand — record a demand request for a product
export async function POST(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const { productId } = await request.json();
  if (!productId) return NextResponse.json({ success: false, error: "productId required" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true } });
  if (!product) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });

  // Get user's area
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { areaName: true } });
  const areaName = dbUser?.areaName || null;

  // Upsert — one request per user per product
  await prisma.demandRequest.upsert({
    where: { productId_userId: { productId, userId: user.id } },
    create: { productId, userId: user.id, areaName },
    update: { areaName, createdAt: new Date() },
  });

  // Get total demand count + recent requesters
  const [totalCount, recentRequesters] = await Promise.all([
    prisma.demandRequest.count({ where: { productId } }),
    prisma.demandRequest.findMany({
      where: { productId },
      select: { user: { select: { firstName: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      productId,
      productName: product.name,
      totalCount,
      recentNames: recentRequesters.map((r) => r.user.firstName),
    },
  });
}

// GET /api/demand?productId=xxx — get demand count for a product
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ success: false, error: "productId required" }, { status: 400 });

  const [totalCount, recentRequesters] = await Promise.all([
    prisma.demandRequest.count({ where: { productId } }),
    prisma.demandRequest.findMany({
      where: { productId },
      select: { user: { select: { firstName: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      productId,
      totalCount,
      recentNames: recentRequesters.map((r) => r.user.firstName),
    },
  });
}
