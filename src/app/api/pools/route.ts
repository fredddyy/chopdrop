import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

function generateBegCode(): string {
  return crypto.randomBytes(4).toString("hex");
}

// GET /api/pools?productId=xxx&area=xxx — list active pools for a product/area, or user pools
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  const mine = request.nextUrl.searchParams.get("mine");
  const area = request.nextUrl.searchParams.get("area");

  if (mine === "true") {
    // Get authenticated user's pools
    const cookieStore = await cookies();
    const token = cookieStore.get("chopdrop-user-token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    const memberships = await prisma.poolMember.findMany({
      where: { userId: user.id },
      include: {
        pool: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true, groupPrice: true, retailPrice: true } },
            members: { select: { id: true, userId: true, quantity: true } },
            creator: { select: { firstName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const pools = memberships.map((m) => ({
      id: m.pool.id,
      product: m.pool.product,
      name: m.pool.name,
      areaName: m.pool.areaName,
      status: m.pool.status,
      minSize: m.pool.minSize,
      memberCount: m.pool.members.length,
      deadline: m.pool.deadline,
      creatorName: m.pool.creator.firstName,
      isCreator: m.pool.creatorId === user.id,
      myQuantity: m.quantity,
      myPaymentStatus: m.paymentStatus,
      begCode: m.begCode,
      begDiscount: m.begDiscount,
    }));

    return NextResponse.json({ success: true, data: pools });
  }

  if (productId) {
    // Get active pools for a specific product, optionally filtered by area
    const where: Record<string, unknown> = { productId, status: "OPEN", deadline: { gt: new Date() } };
    if (area) where.areaName = area;

    const pools = await prisma.pool.findMany({
      where,
      include: {
        members: { select: { id: true, userId: true, quantity: true } },
        creator: { select: { firstName: true } },
        product: { select: { groupPrice: true, minPoolSize: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const data = pools.map((p) => ({
      id: p.id,
      name: p.name,
      areaName: p.areaName,
      status: p.status,
      minSize: p.minSize,
      memberCount: p.members.length,
      totalQuantity: p.members.reduce((sum, m) => sum + m.quantity, 0),
      spotsLeft: p.minSize - p.members.length,
      deadline: p.deadline,
      creatorName: p.creator.firstName,
      groupPrice: p.product.groupPrice,
    }));

    return NextResponse.json({ success: true, data });
  }

  // GET /api/pools?area=xxx — all active pools in an area (discover feed)
  if (area) {
    const pools = await prisma.pool.findMany({
      where: { areaName: area, status: "OPEN", deadline: { gt: new Date() } },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, groupPrice: true, retailPrice: true, minPoolSize: true } },
        members: { select: { id: true, userId: true, quantity: true } },
        creator: { select: { firstName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const data = pools.map((p) => ({
      id: p.id,
      name: p.name,
      areaName: p.areaName,
      status: p.status,
      minSize: p.minSize,
      memberCount: p.members.length,
      spotsLeft: p.minSize - p.members.length,
      deadline: p.deadline,
      creatorName: p.creator.firstName,
      product: p.product,
    }));

    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: false, error: "productId, area, or mine=true required" }, { status: 400 });
}

// POST /api/pools — create a new pool
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { productId, quantity = 1, name, areaName: bodyArea } = body;

  if (!productId) return NextResponse.json({ success: false, error: "productId required" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });

  // Resolve area: explicit override > creator's profile area
  let areaName: string | null = bodyArea || null;
  if (!areaName) {
    const creator = await prisma.user.findUnique({ where: { id: user.id }, select: { areaName: true } });
    areaName = creator?.areaName || null;
  }

  // Default deadline: 6 hours from now
  const deadline = new Date(Date.now() + 6 * 60 * 60 * 1000);

  // Create pool + add creator as first member in one transaction
  const pool = await prisma.$transaction(async (tx) => {
    const newPool = await tx.pool.create({
      data: {
        productId,
        creatorId: user.id,
        name: name || null,
        areaName,
        minSize: product.minPoolSize,
        deadline,
      },
    });

    const member = await tx.poolMember.create({
      data: {
        poolId: newPool.id,
        userId: user.id,
        quantity,
        unitPrice: product.groupPrice,
        totalAmount: product.groupPrice * quantity,
        begCode: generateBegCode(),
      },
    });

    return { ...newPool, begCode: member.begCode };
  });

  return NextResponse.json({
    success: true,
    data: {
      poolId: pool.id,
      productId,
      name: pool.name,
      areaName: pool.areaName,
      minSize: pool.minSize,
      deadline: pool.deadline,
      begCode: pool.begCode,
      shareUrl: `/product/${productId}?pool=${pool.id}`,
    },
  });
}
