import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: {
    name?: string;
    address?: string;
    collectionPoint?: string;
    assistantName?: string | null;
    assistantPhone?: string | null;
    isActive?: boolean;
    zoneId?: string | null;
  } = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.address !== undefined) data.address = body.address;
  if (body.collectionPoint !== undefined) data.collectionPoint = body.collectionPoint;
  if (body.assistantName !== undefined) data.assistantName = body.assistantName || null;
  if (body.assistantPhone !== undefined) data.assistantPhone = body.assistantPhone || null;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.zoneId !== undefined) data.zoneId = body.zoneId || null;

  const office = await prisma.office.update({
    where: { id },
    data,
    include: {
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({ success: true, data: office });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const hard = searchParams.get("hard") === "true";

  if (hard) {
    // Hard delete: remove users, disconnect orders, then delete office
    await prisma.$transaction(async (tx) => {
      // Disconnect orders from this office (keep order records, just unlink)
      await tx.order.updateMany({
        where: { officeId: id },
        data: { officeId: null },
      });

      // Delete users belonging to this office
      await tx.user.deleteMany({
        where: { officeId: id },
      });

      // Delete the office
      await tx.office.delete({
        where: { id },
      });
    });
  } else {
    // Soft delete: just deactivate
    await prisma.office.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ success: true });
}
