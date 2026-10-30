import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/deals
 * Returns all active deals with participant count.
 */
export async function GET() {
  const deals = await prisma.deal.findMany({
    where: { status: "ACTIVE", deadline: { gte: new Date() } },
    include: {
      _count: { select: { participants: { where: { paymentStatus: "SUCCESS" } } } },
      collectionPoints: true,
    },
    orderBy: { deadline: "asc" },
  });

  const data = deals.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl,
    category: d.category,
    brandName: d.brandName,
    brandLogoUrl: d.brandLogoUrl,
    marketPrice: d.marketPrice,
    poolPrice: d.poolPrice,
    minBuyers: d.minBuyers,
    currentBuyers: d._count.participants,
    deadline: d.deadline.toISOString(),
    pickupInfo: d.pickupInfo,
    status: d.status,
    collectionPoints: d.collectionPoints,
  }));

  return NextResponse.json({ success: true, data });
}
