import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const REFUND_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// POST /api/pools/:id/leave — member leaves a pool within refund window
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  // Find the user's membership in this pool
  const member = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: id, userId: user.id } },
  });

  if (!member) {
    return NextResponse.json({ success: false, error: "You are not a member of this pool" }, { status: 404 });
  }

  // Check refund window (30 minutes from join time)
  const elapsed = Date.now() - new Date(member.createdAt).getTime();
  if (elapsed > REFUND_WINDOW_MS) {
    return NextResponse.json({
      success: false,
      error: "Refund window has expired. You can only leave within 30 minutes of joining.",
    }, { status: 400 });
  }

  const refundAmount = member.totalAmount;

  // Refund to wallet + delete membership in a transaction
  await prisma.$transaction(async (tx) => {
    // Find or create credit wallet for user
    let wallet = await tx.creditWallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      wallet = await tx.creditWallet.create({
        data: { userId: user.id, balance: 0 },
      });
    }

    // Create refund transaction
    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: refundAmount,
        type: "POOL_REFUND",
        description: `Refund for leaving pool`,
      },
    });

    // Increment wallet balance
    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: refundAmount } },
    });

    // Delete the pool membership
    await tx.poolMember.delete({
      where: { id: member.id },
    });
  });

  return NextResponse.json({
    success: true,
    data: {
      poolId: id,
      refundAmount,
      message: "You have left the pool. Refund credited to your wallet.",
    },
  });
}
