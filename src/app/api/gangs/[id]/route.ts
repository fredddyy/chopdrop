import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// GET /api/gangs/:id — get gang details with members
export async function GET(
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

  const gang = await prisma.gang.findUnique({
    where: { id },
    include: {
      creator: { select: { firstName: true } },
      members: {
        include: {
          user: { select: { firstName: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!gang) {
    return NextResponse.json(
      { success: false, error: "Gang not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: gang.id,
      name: gang.name,
      emoji: gang.emoji,
      motto: gang.motto,
      campus: gang.campus,
      whatsappLink: gang.whatsappLink,
      inviteCode: gang.inviteCode,
      creatorName: gang.creator.firstName,
      createdAt: gang.createdAt,
      members: gang.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        firstName: m.user.firstName,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    },
  });
}
