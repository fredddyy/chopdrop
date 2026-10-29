import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

/**
 * POST /api/deals/join
 * Body: { dealId, quantity?, collectionPointId? }
 *
 * Joins a deal. For now, marks as SUCCESS immediately (no Paystack for deals yet).
 * TODO: Integrate Paystack payment with auto-refund if pool doesn't fill.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ success: false, error: "Log in first" }, { status: 401 });
  }

  const body = await request.json();
  const { dealId, quantity = 1, collectionPointId } = body;

  if (!dealId) {
    return NextResponse.json({ success: false, error: "Deal ID required" }, { status: 400 });
  }

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.status !== "ACTIVE") {
    return NextResponse.json({ success: false, error: "Deal not available" }, { status: 400 });
  }

  if (new Date() > deal.deadline) {
    return NextResponse.json({ success: false, error: "Deal has expired" }, { status: 400 });
  }

  // Check if already joined
  const existing = await prisma.dealParticipant.findUnique({
    where: { dealId_userId: { dealId, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ success: false, error: "You already joined this deal" }, { status: 400 });
  }

  const totalAmount = deal.poolPrice * quantity;

  const participant = await prisma.dealParticipant.create({
    data: {
      dealId,
      userId: user.id,
      quantity,
      totalAmount,
      collectionPointId: collectionPointId || null,
      paymentStatus: "SUCCESS", // TODO: integrate Paystack
    },
  });

  // Check if deal is now filled
  const participantCount = await prisma.dealParticipant.count({
    where: { dealId, paymentStatus: "SUCCESS" },
  });
  if (participantCount >= deal.minBuyers) {
    await prisma.deal.update({ where: { id: dealId }, data: { status: "FILLED" } });
  }

  return NextResponse.json({ success: true, data: { participantId: participant.id, totalAmount } });
}
