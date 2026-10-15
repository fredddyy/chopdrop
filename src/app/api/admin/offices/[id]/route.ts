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
  } = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.address !== undefined) data.address = body.address;
  if (body.collectionPoint !== undefined) data.collectionPoint = body.collectionPoint;
  if (body.assistantName !== undefined) data.assistantName = body.assistantName || null;
  if (body.assistantPhone !== undefined) data.assistantPhone = body.assistantPhone || null;
  if (body.isActive !== undefined) data.isActive = body.isActive;

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.office.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
