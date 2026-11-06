import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/gangs/invite/:code — public invite link preview (no auth required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const gang = await prisma.gang.findUnique({
    where: { inviteCode: code },
    include: {
      members: { select: { id: true } },
    },
  });

  if (!gang) {
    return NextResponse.json(
      { success: false, error: "Invite link is invalid or expired" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: gang.id,
      name: gang.name,
      emoji: gang.emoji,
      campus: gang.campus,
      memberCount: gang.members.length,
    },
  });
}
