import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/deals — list all deals
 */
export async function GET() {
  const deals = await prisma.deal.findMany({
    include: { _count: { select: { participants: { where: { paymentStatus: "SUCCESS" } } } }, collectionPoints: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: deals.map(d => ({ ...d, currentBuyers: d._count.participants })) });
}

/**
 * POST /api/admin/deals — create a deal
 * Body: { name, description?, imageUrl?, marketPrice, poolPrice, minBuyers, deadline, pickupInfo?, collectionPoints?: {name, address, type}[] }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, imageUrl, marketPrice, poolPrice, minBuyers, deadline, pickupInfo, collectionPoints } = body;

  if (!name || !marketPrice || !poolPrice || !deadline) {
    return NextResponse.json({ success: false, error: "Name, prices, and deadline required" }, { status: 400 });
  }

  const deal = await prisma.deal.create({
    data: {
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      marketPrice: Math.round(marketPrice),
      poolPrice: Math.round(poolPrice),
      minBuyers: minBuyers || 30,
      deadline: new Date(deadline),
      pickupInfo: pickupInfo || null,
      collectionPoints: collectionPoints?.length > 0 ? {
        create: collectionPoints.map((cp: { name: string; address: string; type?: string }) => ({
          name: cp.name, address: cp.address, type: cp.type || "PICKUP",
        })),
      } : undefined,
    },
    include: { collectionPoints: true },
  });

  return NextResponse.json({ success: true, data: deal }, { status: 201 });
}
