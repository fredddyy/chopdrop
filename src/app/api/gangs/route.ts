import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import crypto from "crypto";

// GET /api/gangs?mine=true — list user's gangs
export async function GET(request: NextRequest) {
  const mine = request.nextUrl.searchParams.get("mine");

  if (mine !== "true") {
    return NextResponse.json(
      { success: false, error: "mine=true is required" },
      { status: 400 },
    );
  }

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

  const memberships = await prisma.gangMember.findMany({
    where: { userId: user.id },
    include: {
      gang: {
        include: {
          creator: { select: { firstName: true } },
          members: { select: { id: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const gangs = memberships.map((m) => ({
    id: m.gang.id,
    name: m.gang.name,
    emoji: m.gang.emoji,
    motto: m.gang.motto,
    campus: m.gang.campus,
    inviteCode: m.gang.inviteCode,
    creatorName: m.gang.creator.firstName,
    memberCount: m.gang.members.length,
    myRole: m.role,
    joinedAt: m.joinedAt,
    createdAt: m.gang.createdAt,
  }));

  return NextResponse.json({ success: true, data: gangs });
}

// POST /api/gangs — create a new gang
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { name, emoji, motto, campus, deliveryAddress, whatsappLink } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Gang name is required" },
      { status: 400 },
    );
  }

  // Generate unique invite code
  const inviteCode = crypto.randomBytes(4).toString("hex");

  // Create gang + add creator as ADMIN in one transaction
  const gang = await prisma.$transaction(async (tx) => {
    const newGang = await tx.gang.create({
      data: {
        name: name.trim(),
        emoji: emoji || "🍛",
        motto: motto || null,
        campus: campus || null,
        deliveryAddress: deliveryAddress || null,
        whatsappLink: whatsappLink || null,
        creatorId: user.id,
        inviteCode,
      },
    });

    await tx.gangMember.create({
      data: {
        gangId: newGang.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    return newGang;
  });

  return NextResponse.json({
    success: true,
    data: {
      id: gang.id,
      name: gang.name,
      emoji: gang.emoji,
      motto: gang.motto,
      campus: gang.campus,
      inviteCode: gang.inviteCode,
      whatsappLink: gang.whatsappLink,
      createdAt: gang.createdAt,
    },
  });
}
