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

  // Check if anyone has paid — refund to wallet
  const paidMembers = groupOrder.members.filter(m => m.paymentStatus === "SUCCESS");

  await prisma.$transaction(async (tx) => {
    // Refund each paid member to wallet
    for (const member of paidMembers) {
      if (member.subtotal <= 0) continue;

      let wallet = await tx.creditWallet.findUnique({ where: { userId: member.userId } });
      if (!wallet) {
        wallet = await tx.creditWallet.create({ data: { userId: member.userId, balance: 0 } });
      }

      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: member.subtotal } },
      });

      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          amount: member.subtotal,
          type: "POOL_REFUND",
          description: "Group order cancelled by organiser",
        },
      });
    }

    // Mark order as cancelled
    await tx.groupOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });

  return NextResponse.json({
    success: true,
    data: {
      refunded: paidMembers.length,
      message: paidMembers.length > 0
        ? `Order cancelled. ${paidMembers.length} member${paidMembers.length !== 1 ? "s" : ""} refunded to wallet.`
        : "Order cancelled.",
    },
  });
}
