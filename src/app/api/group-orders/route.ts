import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";
import { calculateDeliveryFeeAsync } from "@/lib/delivery-fee";
import crypto from "crypto";
import { parseGroupTiers, getGroupDiscount } from "@/lib/group-tier-pricing";

// GET /api/group-orders?mine=true — list user's group orders
// GET /api/group-orders?gangId=xxx — list group orders for a gang
// GET /api/group-orders?restaurantId=xxx — active group order for a restaurant (public)
export async function GET(request: NextRequest) {
  const mine = request.nextUrl.searchParams.get("mine");
  const gangId = request.nextUrl.searchParams.get("gangId");
  const restaurantId = request.nextUrl.searchParams.get("restaurantId");

  // Public — active group order for a restaurant (no auth needed)
  if (restaurantId) {
    const now = new Date();
    const order = await prisma.groupOrder.findFirst({
      where: { restaurantId, status: "OPEN", deadline: { gt: now } },
      include: {
        coordinator: { select: { firstName: true } },
        members: {
          select: {
            userId: true,
            paymentStatus: true,
            user: { select: { firstName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        restaurant: { select: { groupTiers: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!order) return NextResponse.json({ success: true, data: null });

    const paidCount = order.members.filter(m => m.paymentStatus === "SUCCESS").length;
    const tiers = parseGroupTiers(order.restaurant.groupTiers);
    const { discount, nextTier } = getGroupDiscount(tiers, paidCount);

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        inviteCode: order.inviteCode,
        deadline: order.deadline,
        status: order.status,
        coordinatorName: order.coordinator.firstName,
        memberCount: order.members.length,
        paidMemberCount: paidCount,
        memberNames: order.members.slice(0, 6).map(m => m.user.firstName),
        currentDiscount: discount,
        nextTier,
        spotsToNextTier: nextTier ? Math.max(0, nextTier.min - paidCount) : 0,
        tiers,
      },
    });
  }

  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  // Filter by gang — show all group orders linked to this gang
  if (gangId) {
    const orders = await prisma.groupOrder.findMany({
      where: { gangId },
      include: {
        restaurant: { select: { name: true, imageUrl: true, groupTiers: true } },
        coordinator: { select: { firstName: true } },
        members: { select: { id: true, paymentStatus: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = orders.map((o) => {
      const paidCount = o.members.filter((m) => m.paymentStatus === "SUCCESS").length;
      const tiers = parseGroupTiers(o.restaurant.groupTiers);
      const { discount } = getGroupDiscount(tiers, paidCount);
      return {
        id: o.id,
        restaurantName: o.restaurant.name,
        restaurantImage: o.restaurant.imageUrl,
        coordinatorName: o.coordinator.firstName,
        memberCount: o.members.length,
        paidMemberCount: paidCount,
        currentDiscount: discount,
        status: o.status,
        deadline: o.deadline,
        deliveryAddress: o.deliveryAddress,
        deliveryFee: o.deliveryFee,
        inviteCode: o.inviteCode,
      };
    });

    return NextResponse.json({ success: true, data });
  }

  if (mine !== "true") {
    return NextResponse.json({ success: false, error: "mine=true or gangId required" }, { status: 400 });
  }

  const memberships = await prisma.groupOrderMember.findMany({
    where: { userId: user.id },
    include: {
      groupOrder: {
        include: {
          restaurant: { select: { name: true } },
          coordinator: { select: { firstName: true } },
          members: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = memberships.map((m) => ({
    id: m.groupOrder.id,
    restaurantName: m.groupOrder.restaurant.name,
    coordinatorName: m.groupOrder.coordinator.firstName,
    memberCount: m.groupOrder.members.length,
    status: m.groupOrder.status,
    deadline: m.groupOrder.deadline,
    deliveryAddress: m.groupOrder.deliveryAddress,
    deliveryFee: m.groupOrder.deliveryFee,
    inviteCode: m.groupOrder.inviteCode,
    myPaymentStatus: m.paymentStatus,
    mySubtotal: m.subtotal,
  }));

  return NextResponse.json({ success: true, data });
}

// POST /api/group-orders — create a new group order
export async function POST(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { restaurantId, deliveryAddress, deliveryLat, deliveryLng, deadline, gang: gangId } = body;

  if (!restaurantId || !deliveryAddress || !deadline) {
    return NextResponse.json({ success: false, error: "restaurantId, deliveryAddress, and deadline are required" }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true, latitude: true, longitude: true },
  });
  if (!restaurant) return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });

  const inviteCode = crypto.randomBytes(4).toString("hex");

  // Calculate delivery fee if coordinates are available
  let deliveryFee = 0;
  const storeLat = restaurant.latitude;
  const storeLng = restaurant.longitude;

  if (deliveryLat && deliveryLng && storeLat && storeLng) {
    const result = await calculateDeliveryFeeAsync(storeLat, storeLng, deliveryLat, deliveryLng, prisma);
    deliveryFee = result.fee;
  }

  const result = await prisma.$transaction(async (tx) => {
    const groupOrder = await tx.groupOrder.create({
      data: {
        restaurantId,
        coordinatorId: user.id,
        gangId: gangId || null,
        inviteCode,
        deliveryAddress,
        deliveryLat: deliveryLat || null,
        deliveryLng: deliveryLng || null,
        deadline: new Date(deadline),
        deliveryFee,
      },
    });

    await tx.groupOrderMember.create({
      data: {
        groupOrderId: groupOrder.id,
        userId: user.id,
        items: [],
      },
    });

    return groupOrder;
  });

  return NextResponse.json({
    success: true,
    data: {
      id: result.id,
      inviteCode: result.inviteCode,
    },
  });
}
