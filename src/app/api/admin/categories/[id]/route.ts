import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH — update a category
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const category = await prisma.menuCategory.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ success: true, data: category });
}

// DELETE — delete a category and all its items
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Delete all items in category first
  await prisma.menuItem.deleteMany({ where: { categoryId: id } });
  await prisma.menuCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
