import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

// POST /api/group-orders/:id/leave — leave a group order (non-paid members only)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const member = await prisma.groupOrderMember.findUnique({
    where: { groupOrderId_userId: { groupOrderId: id, userId: user.id } },
    include: { groupOrder: { select: { coordinatorId: true, status: true } } },
  });

  if (!member) return NextResponse.json({ success: false, error: "You're not in this group order" }, { status: 404 });

  // Can't leave if already paid
  if (member.paymentStatus === "SUCCESS") {
    return NextResponse.json({ success: false, error: "You've already paid. Contact the organiser." }, { status: 400 });
  }

  // Coordinator can't leave (they should cancel instead)
  if (member.groupOrder.coordinatorId === user.id) {
    return NextResponse.json({ success: false, error: "You're the organiser. Cancel the order instead of leaving." }, { status: 400 });
  }

  await prisma.groupOrderMember.delete({ where: { id: member.id } });

  return NextResponse.json({
    success: true,
    data: { message: "You left the group order." },
  });
}
