import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.type !== undefined) data.type = body.type;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.minOrders !== undefined) data.minOrders = body.minOrders;
  if (body.rewardAmount !== undefined) data.rewardAmount = body.rewardAmount;
  if (body.rewardType !== undefined) data.rewardType = body.rewardType;
  if (body.cutoffTime !== undefined) data.cutoffTime = body.cutoffTime || null;
  if (body.maxUses !== undefined) data.maxUses = body.maxUses;
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.officeOnly !== undefined) data.officeOnly = body.officeOnly;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;

  const promo = await prisma.promo.update({
    where: { id },
    data,
  });

  // If this promo was activated, deactivate all others
  if (body.isActive === true) {
    await prisma.promo.updateMany({
      where: { id: { not: id }, isActive: true },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ success: true, data: promo });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.promo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
