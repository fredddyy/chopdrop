import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

export async function GET() {
  const payload = await getUserFromCookie();
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const [user, wallet, poolCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.id }, include: { office: true } }),
    prisma.creditWallet.findUnique({ where: { userId: payload.id }, select: { balance: true } }),
    prisma.poolMember.count({ where: { userId: payload.id } }),
  ]);

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      walletBalance: wallet?.balance || 0,
      poolsJoined: poolCount,
      office: user.office ? { id: user.office.id, name: user.office.name, code: user.office.code, slug: user.office.slug, secretToken: user.office.secretToken, collectionPoint: user.office.collectionPoint, address: user.office.address, assistantName: user.office.assistantName, assistantPhone: user.office.assistantPhone } : null,
    },
  });
}

// PATCH — update profile (name, avatar, area)
export async function PATCH(request: NextRequest) {
  const payload = await getUserFromCookie();
  if (!payload) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { firstName, lastName, avatarUrl, areaName, deliveryAddress } = body;

  const data: Record<string, string> = {};
  if (firstName?.trim()) data.firstName = firstName.trim();
  if (lastName?.trim()) data.lastName = lastName.trim();
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (areaName !== undefined) data.areaName = areaName;

  if (Object.keys(data).length === 0 && !deliveryAddress) {
    return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: payload.id },
    data,
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, areaName: true },
  });

  return NextResponse.json({ success: true, data: user });
}
