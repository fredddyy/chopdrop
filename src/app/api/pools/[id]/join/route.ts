import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { calculateDeliveryFeeAsync } from "@/lib/delivery-fee";

// POST /api/pools/:id/join — join an existing pool
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { quantity = 1, deliveryAddress, lat, lng } = body;

  const pool = await prisma.pool.findUnique({
    where: { id },
    include: {
      members: true,
      product: {
        select: { groupPrice: true, minPoolSize: true, name: true, category: true, vendor: { select: { latitude: true, longitude: true } } },
      },
    },
  });

  if (!pool) return NextResponse.json({ success: false, error: "Pool not found" }, { status: 404 });
  if (pool.status !== "OPEN") return NextResponse.json({ success: false, error: "Pool is no longer open" }, { status: 400 });
  if (pool.deadline < new Date()) return NextResponse.json({ success: false, error: "Pool has expired" }, { status: 400 });

  // Check if user is already a member
  const existing = pool.members.find((m) => m.userId === user.id);
  if (existing) return NextResponse.json({ success: false, error: "You already joined this pool" }, { status: 400 });

  // Check if pool is full
  if (pool.members.length >= pool.minSize) {
    return NextResponse.json({ success: false, error: "Pool is already full" }, { status: 400 });
  }

  // Calculate delivery fee using centralized loader
  let deliveryFee = 0;
  let fullDeliveryFee = 0;
  const storeLat = pool.product.vendor.latitude;
  const storeLng = pool.product.vendor.longitude;

  if (lat && lng && storeLat && storeLng) {
    const result = await calculateDeliveryFeeAsync(storeLat, storeLng, lat, lng, prisma);
    fullDeliveryFee = result.fee;
    // Count existing delivery members + this new one
    const deliveryMemberCount = pool.members.filter((m: { deliveryFee: number }) => m.deliveryFee > 0).length + 1;
    deliveryFee = Math.round(fullDeliveryFee / Math.max(deliveryMemberCount, 1));
  }

  // Use flash price if this is a flash deal, otherwise group price
  const effectivePrice = pool.isFlashDeal && pool.flashPrice ? pool.flashPrice : pool.product.groupPrice;

  // Add member + check if pool is now filled
  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.poolMember.create({
      data: {
        poolId: id,
        userId: user.id,
        quantity,
        unitPrice: effectivePrice,
        totalAmount: effectivePrice * quantity,
        deliveryAddress: deliveryAddress || null,
        deliveryLat: lat || null,
        deliveryLng: lng || null,
        deliveryFee,
      },
    });

    const newMemberCount = pool.members.length + 1;

    // If pool is now filled, update status
    if (newMemberCount >= pool.minSize) {
      await tx.pool.update({
        where: { id },
        data: { status: "FILLED" },
      });
    }

    return { member, filled: newMemberCount >= pool.minSize, memberCount: newMemberCount };
  });

  return NextResponse.json({
    success: true,
    data: {
      poolId: id,
      memberCount: result.memberCount,
      filled: result.filled,
      unitPrice: effectivePrice,
      totalAmount: effectivePrice * quantity,
      deliveryFee,
      fullDeliveryFee,
      subsidizedFee: deliveryFee,
      deliveryFeeFormatted: deliveryFee > 0 ? `₦${(deliveryFee / 100).toLocaleString()}` : "Free (pickup)",
      message: result.filled
        ? `Pool filled! All ${pool.minSize} people pay ${pool.product.groupPrice} for ${pool.product.name}`
        : `Joined! ${result.memberCount}/${pool.minSize} — ${pool.minSize - result.memberCount} more needed`,
    },
  });
}
