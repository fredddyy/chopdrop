import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// POST /api/group-orders/:id/join — join a group order
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

  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id },
    include: { members: { select: { userId: true } } },
  });

  if (!groupOrder) return NextResponse.json({ success: false, error: "Group order not found" }, { status: 404 });
  if (groupOrder.status !== "OPEN") return NextResponse.json({ success: false, error: "Group order is no longer open" }, { status: 400 });
  if (groupOrder.deadline < new Date()) return NextResponse.json({ success: false, error: "Deadline has passed" }, { status: 400 });

  const alreadyMember = groupOrder.members.some((m) => m.userId === user.id);
  if (alreadyMember) return NextResponse.json({ success: false, error: "You already joined this group order" }, { status: 400 });

  const member = await prisma.groupOrderMember.create({
    data: {
      groupOrderId: id,
      userId: user.id,
      items: [],
    },
  });

  // Auto-add to gang if this group order is linked to one
  if (groupOrder.gangId) {
    const existingGangMember = await prisma.gangMember.findUnique({
      where: { gangId_userId: { gangId: groupOrder.gangId, userId: user.id } },
    });
    if (!existingGangMember) {
      await prisma.gangMember.create({
        data: { gangId: groupOrder.gangId, userId: user.id, role: "MEMBER" },
      }).catch(() => {}); // silently skip if unique constraint race
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      id: member.id,
      groupOrderId: member.groupOrderId,
      userId: member.userId,
    },
  });
}
