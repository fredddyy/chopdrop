import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// POST /api/gangs/:id/leave — leave a gang
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token)
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  const user = verifyToken(token);
  if (!user)
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 },
    );

  // Find the user's membership
  const member = await prisma.gangMember.findUnique({
    where: { gangId_userId: { gangId: id, userId: user.id } },
  });

  if (!member) {
    return NextResponse.json(
      { success: false, error: "You are not a member of this gang" },
      { status: 404 },
    );
  }

  // Get the gang with all members to handle admin transfer / deletion
  const gang = await prisma.gang.findUnique({
    where: { id },
    include: {
      members: { orderBy: { joinedAt: "asc" } },
    },
  });

  if (!gang) {
    return NextResponse.json(
      { success: false, error: "Gang not found" },
      { status: 404 },
    );
  }

  await prisma.$transaction(async (tx) => {
    // Delete the membership
    await tx.gangMember.delete({
      where: { id: member.id },
    });

    const remainingMembers = gang.members.filter(
      (m) => m.userId !== user.id,
    );

    if (remainingMembers.length === 0) {
      // No members left — delete the gang
      await tx.gang.delete({ where: { id } });
    } else if (gang.creatorId === user.id) {
      // Creator is leaving — transfer ADMIN to the next oldest member
      const nextAdmin = remainingMembers[0];
      await tx.gangMember.update({
        where: { id: nextAdmin.id },
        data: { role: "ADMIN" },
      });
      await tx.gang.update({
        where: { id },
        data: { creatorId: nextAdmin.userId },
      });
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      gangId: id,
      message: "You have left the gang.",
    },
  });
}
