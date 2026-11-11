import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/flash-deals
export async function GET() {
  const deals = await prisma.pool.findMany({
    where: { isFlashDeal: true },
    include: {
      product: { select: { name: true, imageUrl: true, retailPrice: true, groupPrice: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    success: true,
    data: deals.map((d) => ({
      id: d.id,
      productName: d.product.name,
      retailPrice: d.product.retailPrice,
      groupPrice: d.product.groupPrice,
      flashPrice: d.flashPrice,
      minSize: d.minSize,
      memberCount: d._count.members,
      status: d.status,
      deadline: d.deadline,
      createdAt: d.createdAt,
    })),
  });
}

// POST /api/admin/flash-deals
export async function POST(request: NextRequest) {
  const { productId, flashPrice, durationMinutes, minSize } = await request.json();

  if (!productId || !flashPrice || !durationMinutes) {
    return NextResponse.json({ success: false, error: "productId, flashPrice, and durationMinutes required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, minPoolSize: true },
  });
  if (!product) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });

  // Use the first user as system creator for flash deals
  const systemUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!systemUser) return NextResponse.json({ success: false, error: "No users" }, { status: 500 });

  const pool = await prisma.pool.create({
    data: {
      productId,
      creatorId: systemUser.id,
      name: `Flash: ${product.name}`,
      status: "OPEN",
      minSize: minSize || product.minPoolSize,
      deadline: new Date(Date.now() + durationMinutes * 60 * 1000),
      isFlashDeal: true,
      flashPrice,
    },
  });

  return NextResponse.json({ success: true, data: { id: pool.id, deadline: pool.deadline } });
}
