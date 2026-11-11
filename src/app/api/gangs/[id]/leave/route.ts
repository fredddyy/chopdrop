import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

// POST /api/gangs/:id/leave — leave a gang
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const membership = await prisma.gangMember.findUnique({
    where: { gangId_userId: { gangId: id, userId: user.id } },
  });

  if (!membership) {
    return NextResponse.json({ success: false, error: "You are not a member of this gang" }, { status: 404 });
  }

  // Admins can't leave if there are other members
  if (membership.role === "ADMIN") {
    const memberCount = await prisma.gangMember.count({ where: { gangId: id } });
    if (memberCount > 1) {
      return NextResponse.json({
        success: false,
        error: "You're the admin. Transfer admin to another member before leaving.",
      }, { status: 400 });
    }
  }

  await prisma.gangMember.delete({ where: { id: membership.id } });

  return NextResponse.json({
    success: true,
    data: { message: "You left the gang." },
  });
}
