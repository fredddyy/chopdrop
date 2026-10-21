import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const promos = await prisma.promo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: promos });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const promo = await prisma.promo.create({
      data: {
        name: body.name,
        type: body.type,
        isActive: body.isActive ?? false,
        minOrders: body.minOrders ?? 5,
        rewardAmount: body.rewardAmount ?? 0,
        rewardType: body.rewardType ?? "CASHBACK",
        cutoffTime: body.cutoffTime || null,
        maxUses: body.maxUses ?? 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        officeOnly: body.officeOnly ?? true,
        description: body.description || null,
      },
    });

    // If this promo is active, deactivate all others
    if (promo.isActive) {
      await prisma.promo.updateMany({
        where: { id: { not: promo.id }, isActive: true },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true, data: promo }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
