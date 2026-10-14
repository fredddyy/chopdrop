import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const meal = await prisma.meal.update({
    where: { id },
    data: body,
    include: { restaurant: true },
  });

  return NextResponse.json({ success: true, data: meal });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.meal.update({
    where: { id },
    data: { isAvailable: false },
  });

  return NextResponse.json({ success: true });
}
