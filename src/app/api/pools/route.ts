import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// GET /api/pools?productId=xxx — list active pools for a product, or all user pools
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  const mine = request.nextUrl.searchParams.get("mine");

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
      status: m.pool.status,
      minSize: m.pool.minSize,
      memberCount: m.pool.members.length,
      deadline: m.pool.deadline,
      creatorName: m.pool.creator.firstName,
      isCreator: m.pool.creatorId === user.id,
      myQuantity: m.quantity,
      myPaymentStatus: m.paymentStatus,
    }));

    return NextResponse.json({ success: true, data: pools });
  }

  if (productId) {
    // Get active pools for a specific product
    const pools = await prisma.pool.findMany({
      where: { productId, status: "OPEN", deadline: { gt: new Date() } },
      include: {
        members: { select: { id: true, userId: true, quantity: true } },
        creator: { select: { firstName: true } },
        product: { select: { groupPrice: true, minPoolSize: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const data = pools.map((p) => ({
      id: p.id,
      name: p.name,
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

  return NextResponse.json({ success: false, error: "productId or mine=true required" }, { status: 400 });
}

// POST /api/pools — create a new pool
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { productId, quantity = 1, name } = body;

  if (!productId) return NextResponse.json({ success: false, error: "productId required" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });

  // Default deadline: 6 hours from now
  const deadline = new Date(Date.now() + 6 * 60 * 60 * 1000);

  // Create pool + add creator as first member in one transaction
  const pool = await prisma.$transaction(async (tx) => {
    const newPool = await tx.pool.create({
      data: {
        productId,
        creatorId: user.id,
        name: name || null,
        minSize: product.minPoolSize,
        deadline,
      },
    });

    await tx.poolMember.create({
      data: {
        poolId: newPool.id,
        userId: user.id,
        quantity,
        unitPrice: product.groupPrice,
        totalAmount: product.groupPrice * quantity,
      },
    });

    return newPool;
  });

  return NextResponse.json({
    success: true,
    data: {
      poolId: pool.id,
      productId,
      name: pool.name,
      minSize: pool.minSize,
      deadline: pool.deadline,
      shareUrl: `/product/${productId}?pool=${pool.id}`,
    },
  });
}
