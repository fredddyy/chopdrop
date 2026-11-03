import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/pools — list all pools for ops dashboard
export async function GET() {
  const pools = await prisma.pool.findMany({
    include: {
      product: { select: { name: true, groupPrice: true } },
      creator: { select: { firstName: true } },
      members: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const data = pools.map((p) => ({
    id: p.id,
    name: p.name,
    areaName: p.areaName,
    status: p.status,
    minSize: p.minSize,
    deadline: p.deadline,
    createdAt: p.createdAt,
    product: { name: p.product.name, groupPrice: p.product.groupPrice },
    creatorName: p.creator.firstName,
    memberCount: p.members.length,
    spotsLeft: Math.max(0, p.minSize - p.members.length),
  }));

  return NextResponse.json({ success: true, data });
}
