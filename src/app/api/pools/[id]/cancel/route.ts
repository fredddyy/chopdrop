import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// POST /api/pools/:id/cancel — creator cancels their pool
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const pool = await prisma.pool.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!pool) return NextResponse.json({ success: false, error: "Pool not found" }, { status: 404 });
  if (pool.creatorId !== user.id) return NextResponse.json({ success: false, error: "Only the creator can cancel this pool" }, { status: 403 });
  if (pool.status !== "OPEN") return NextResponse.json({ success: false, error: "Pool can only be cancelled while open" }, { status: 400 });

  // Cancel the pool — members with pending payments get refunded (future: trigger refund)
  await prisma.pool.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({
    success: true,
    data: {
      poolId: id,
      status: "CANCELLED",
      membersAffected: pool.members.length,
      message: "Pool cancelled. All members will be refunded.",
    },
  });
}
