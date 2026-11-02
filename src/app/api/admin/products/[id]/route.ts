import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/products/[id] — product detail
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { vendor: { select: { id: true, name: true, imageUrl: true } } },
  });
  if (!product) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: product });
}

// PATCH /api/admin/products/[id] — update product
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
    if (body.category !== undefined) updates.category = body.category;
    if (body.subcategory !== undefined) updates.subcategory = body.subcategory;
    if (body.retailPrice !== undefined) updates.retailPrice = Math.round(Number(body.retailPrice) * 100);
    if (body.groupPrice !== undefined) updates.groupPrice = Math.round(Number(body.groupPrice) * 100);
    if (body.minPoolSize !== undefined) updates.minPoolSize = body.minPoolSize;
    if (body.poolTiers !== undefined) updates.poolTiers = body.poolTiers;
    if (body.maxQuantity !== undefined) updates.maxQuantity = body.maxQuantity;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

    const product = await prisma.product.update({
      where: { id },
      data: updates,
      include: { vendor: { select: { id: true, name: true, imageUrl: true } } },
    });

    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — soft delete (set isActive: false)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
