import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH — update a menu item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const item = await prisma.menuItem.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ success: true, data: item });
}

// DELETE — delete a menu item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
