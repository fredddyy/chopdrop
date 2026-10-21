import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ success: false, error: "Sign in first" }, { status: 401 });
  }

  const body = await request.json();
  const { name, address, size } = body;

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json({ success: false, error: "Name and address required" }, { status: 400 });
  }

  // Generate slug from name
  const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 30);
  const slug = `${baseSlug}-${nanoid(4).toLowerCase()}`;

  // Generate office code from name
  const prefix = name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "OFF";
  const suffix = Math.floor(100 + Math.random() * 900);
  const code = `${prefix}-${suffix}`;

  const secretToken = nanoid(12);

  // Get user's full data for captain info
  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });

  const office = await prisma.office.create({
    data: {
      name: name.trim(),
      code,
      slug,
      secretToken,
      address: address.trim(),
      collectionPoint: "Main reception",
      assistantName: fullUser ? `${fullUser.firstName} ${fullUser.lastName}` : null,
      assistantPhone: fullUser?.phone || null,
      isActive: true,
    },
  });

  // Connect the captain to this office
  await prisma.user.update({
    where: { id: user.id },
    data: { officeId: office.id },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: office.id,
      name: office.name,
      code: office.code,
      slug: office.slug,
      address: office.address,
      size: size || "10-20",
      joinLink: `/join/${office.slug}`,
      captainLink: `/captain/${office.slug}?token=${office.secretToken}`,
    },
  }, { status: 201 });
}
