import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { parseGroupTiers, getGroupDiscount } from "@/lib/group-tier-pricing";

// GET /api/group-orders/:id — full group order detail with tier info
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id },
    include: {
      restaurant: { select: { id: true, name: true, imageUrl: true, groupTiers: true } },
      coordinator: { select: { id: true, firstName: true } },
      members: {
        include: {
          user: { select: { id: true, firstName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!groupOrder) return NextResponse.json({ success: false, error: "Group order not found" }, { status: 404 });

  // Calculate tier info
  const paidCount = groupOrder.members.filter((m) => m.paymentStatus === "SUCCESS").length;
  const tiers = parseGroupTiers(groupOrder.restaurant.groupTiers);
  const { discount, tierIndex, nextTier } = getGroupDiscount(tiers, paidCount);

  return NextResponse.json({
    success: true,
    data: {
      id: groupOrder.id,
      inviteCode: groupOrder.inviteCode,
      status: groupOrder.status,
      deadline: groupOrder.deadline,
      deliveryAddress: groupOrder.deliveryAddress,
      deliveryFee: groupOrder.deliveryFee,
      settled: groupOrder.settled,
      createdAt: groupOrder.createdAt,
      restaurant: {
        id: groupOrder.restaurant.id,
        name: groupOrder.restaurant.name,
        imageUrl: groupOrder.restaurant.imageUrl,
      },
      coordinator: groupOrder.coordinator,
      members: groupOrder.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        firstName: m.user.firstName,
        items: m.items,
        subtotal: m.subtotal,
        deliveryShare: m.deliveryShare,
        paymentStatus: m.paymentStatus,
      })),
      // Tier info for UI
      groupTiers: tiers,
      paidMemberCount: paidCount,
      currentDiscount: discount,
      currentTierIndex: tierIndex,
      nextTier,
    },
  });
}
