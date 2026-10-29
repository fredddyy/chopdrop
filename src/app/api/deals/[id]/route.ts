import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/deals/[id]
 * Returns deal detail with participants.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      participants: {
        where: { paymentStatus: "SUCCESS" },
        include: { user: { select: { firstName: true } }, collectionPoint: true },
        orderBy: { createdAt: "desc" },
      },
      collectionPoints: true,
    },
  });

  if (!deal) {
    return NextResponse.json({ success: false, error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: deal.id,
      name: deal.name,
      description: deal.description,
      imageUrl: deal.imageUrl,
      marketPrice: deal.marketPrice,
      poolPrice: deal.poolPrice,
      minBuyers: deal.minBuyers,
      currentBuyers: deal.participants.length,
      deadline: deal.deadline.toISOString(),
      pickupInfo: deal.pickupInfo,
      status: deal.status,
      collectionPoints: deal.collectionPoints,
      participants: deal.participants.map(p => ({
        id: p.id,
        firstName: p.user.firstName,
        quantity: p.quantity,
        collectionPoint: p.collectionPoint?.name || null,
      })),
    },
  });
}
