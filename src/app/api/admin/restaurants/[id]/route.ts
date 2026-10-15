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
    phone?: string;
    imageUrl?: string | null;
    isActive?: boolean;
  } = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.address !== undefined) data.address = body.address;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true, data: restaurant });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.restaurant.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
