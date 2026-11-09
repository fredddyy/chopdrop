import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/pools/[id]/members — list pool members for ops dashboard
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const members = await prisma.poolMember.findMany({
    where: { poolId: id },
    select: {
      id: true,
      quantity: true,
      paymentStatus: true,
      createdAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, data: members });
}
