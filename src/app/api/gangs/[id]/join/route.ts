import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// POST /api/gangs/:id/join — join a gang
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

  // Check gang exists
  const gang = await prisma.gang.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!gang) {
    return NextResponse.json(
      { success: false, error: "Gang not found" },
      { status: 404 },
    );
  }

  // Check if user is already a member
  const existing = await prisma.gangMember.findUnique({
    where: { gangId_userId: { gangId: id, userId: user.id } },
  });

  if (existing) {
    return NextResponse.json(
      { success: false, error: "You are already a member of this gang" },
      { status: 400 },
    );
  }

  await prisma.gangMember.create({
    data: {
      gangId: id,
      userId: user.id,
      role: "MEMBER",
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      gangId: id,
      gangName: gang.name,
      message: `You joined ${gang.name}!`,
    },
  });
}
