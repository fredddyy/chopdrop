import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const menu = await prisma.dailyMenu.update({
    where: { id },
    data: body,
    include: {
      meal: { include: { restaurant: true } },
      timeSlot: true,
    },
  });

  return NextResponse.json({ success: true, data: menu });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.dailyMenu.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
