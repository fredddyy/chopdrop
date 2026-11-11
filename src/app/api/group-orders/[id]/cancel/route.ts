import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

// POST /api/group-orders/:id/cancel — coordinator cancels the group order
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id },
    include: {
      members: { select: { id: true, paymentStatus: true, subtotal: true, userId: true } },
    },
  });

  if (!groupOrder) return NextResponse.json({ success: false, error: "Group order not found" }, { status: 404 });

  // Only the coordinator can cancel
  if (groupOrder.coordinatorId !== user.id) {
    return NextResponse.json({ success: false, error: "Only the organiser can cancel this order" }, { status: 403 });
  }

  // Can't cancel if already delivered or cancelled
  if (groupOrder.status === "DELIVERED" || groupOrder.status === "CANCELLED") {
    return NextResponse.json({ success: false, error: `Order is already ${groupOrder.status.toLowerCase()}` }, { status: 400 });
  }

  // Block cancel if anyone has paid
  const paidMembers = groupOrder.members.filter(m => m.paymentStatus === "SUCCESS");
  if (paidMembers.length > 0) {
    return NextResponse.json({
      success: false,
      error: `Can't cancel — ${paidMembers.length} member${paidMembers.length !== 1 ? "s have" : " has"} already paid.`,
    }, { status: 400 });
  }

  // No one paid — safe to cancel
  await prisma.groupOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({
    success: true,
    data: { message: "Order cancelled." },
  });
}
