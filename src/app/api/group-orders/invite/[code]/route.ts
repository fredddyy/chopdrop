import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/group-orders/invite/:code — public invite preview (no auth required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const groupOrder = await prisma.groupOrder.findUnique({
    where: { inviteCode: code },
    include: {
      restaurant: { select: { name: true } },
      coordinator: { select: { firstName: true } },
      members: { select: { id: true } },
    },
  });

  if (!groupOrder) return NextResponse.json({ success: false, error: "Invite not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      id: groupOrder.id,
      restaurantName: groupOrder.restaurant.name,
      coordinatorName: groupOrder.coordinator.firstName,
      deadline: groupOrder.deadline,
      memberCount: groupOrder.members.length,
      deliveryAddress: groupOrder.deliveryAddress,
      status: groupOrder.status,
    },
  });
}
