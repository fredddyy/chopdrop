import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// POST /api/pools/find-or-create — join existing pool of matching size, or create new one
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { productId, minSize, quantity = 1 } = body as { productId: string; minSize: number; quantity?: number };

  if (!productId || !minSize || minSize < 2) {
    return NextResponse.json({ success: false, error: "productId and minSize (>= 2) required" }, { status: 400 });
  }

  // Fetch product + restaurant tiers
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { vendor: { select: { id: true, groupTiers: true } } },
  });
  if (!product || !product.isActive) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  // Flat discount model — use restaurant's groupDiscount (default 30%)
  const vendor = await prisma.restaurant.findUnique({ where: { id: product.vendorId }, select: { groupDiscount: true } });
  const discountPct = vendor?.groupDiscount || 30;
  const unitPrice = Math.round(product.retailPrice * (1 - discountPct / 100));

  // Resolve area from user profile
  const creator = await prisma.user.findUnique({ where: { id: user.id }, select: { areaName: true } });
  const areaName = creator?.areaName || null;

  // Pool timer — 25 minutes (0.4167 hours) for the flat group model
  const timerSetting = await prisma.setting.findUnique({ where: { key: "pool-default-timer-mins" } });
  const poolMins = timerSetting?.value && Number(timerSetting.value) > 0 ? Number(timerSetting.value) : 25;
  const poolHours = poolMins / 60;

  // Atomic find-or-create in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Try to find an existing open pool of this size with space
    const existingPool = await tx.pool.findFirst({
      where: {
        productId,
        minSize,
        status: "OPEN",
        deadline: { gt: new Date() },
      },
      include: { members: { select: { userId: true } } },
      orderBy: { createdAt: "desc" },
    });

    if (existingPool && existingPool.members.length < existingPool.minSize) {
      // Check user isn't already a member
      if (existingPool.members.some(m => m.userId === user.id)) {
        return { action: "already_joined" as const, poolId: existingPool.id, memberCount: existingPool.members.length, minSize: existingPool.minSize };
      }

      // Join existing pool
      await tx.poolMember.create({
        data: {
          poolId: existingPool.id,
          userId: user.id,
          quantity,
          unitPrice,
          totalAmount: unitPrice * quantity,
        },
      });

      const newCount = existingPool.members.length + 1;

      // Check if pool is now filled
      if (newCount >= existingPool.minSize) {
        await tx.pool.update({ where: { id: existingPool.id }, data: { status: "FILLED" } });
      }

      // Reset deadline if this was the first member (pool was empty after leaves)
      if (existingPool.members.length === 0) {
        await tx.pool.update({
          where: { id: existingPool.id },
          data: { deadline: new Date(Date.now() + poolHours * 3600000) },
        });
      }

      return { action: "joined" as const, poolId: existingPool.id, memberCount: newCount, minSize: existingPool.minSize };
    }

    // 2. No existing pool — create new one
    const deadline = new Date(Date.now() + poolHours * 3600000);
    const newPool = await tx.pool.create({
      data: {
        productId,
        creatorId: user.id,
        areaName,
        minSize,
        deadline,
      },
    });

    await tx.poolMember.create({
      data: {
        poolId: newPool.id,
        userId: user.id,
        quantity,
        unitPrice,
        totalAmount: unitPrice * quantity,
      },
    });

    return { action: "created" as const, poolId: newPool.id, memberCount: 1, minSize };
  });

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      unitPrice,
      discount: discountPct,
      totalAmount: unitPrice * quantity,
    },
  });
}
