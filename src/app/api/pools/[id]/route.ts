import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pools/:id — pool detail with members
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const pool = await prisma.pool.findUnique({
    where: { id },
    include: {
      product: {
        select: { id: true, name: true, imageUrl: true, retailPrice: true, groupPrice: true, minPoolSize: true, vendor: { select: { name: true } } },
      },
      creator: { select: { firstName: true } },
      members: {
        select: {
          id: true,
          userId: true,
          quantity: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { firstName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!pool) return NextResponse.json({ success: false, error: "Pool not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      id: pool.id,
      name: pool.name,
      status: pool.status,
      minSize: pool.minSize,
      deadline: pool.deadline,
      createdAt: pool.createdAt,
      product: pool.product,
      creatorName: pool.creator.firstName,
      memberCount: pool.members.length,
      spotsLeft: Math.max(0, pool.minSize - pool.members.length),
      members: pool.members.map((m) => ({
        id: m.id,
        firstName: m.user.firstName,
        quantity: m.quantity,
        paymentStatus: m.paymentStatus,
        joinedAt: m.createdAt,
      })),
    },
  });
}
