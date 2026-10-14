import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie, signUserToken, COOKIE_NAME } from "@/lib/user-auth";

export async function POST(request: NextRequest) {
  const payload = await getUserFromCookie();
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const code = body.code?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ success: false, error: "Office code is required" }, { status: 400 });
  }

  const office = await prisma.office.findUnique({ where: { code } });
  if (!office || !office.isActive) {
    return NextResponse.json({ success: false, error: "Office not found. Check your code." }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: payload.id },
    data: { officeId: office.id },
  });

  // Re-sign token with updated officeId
  const newToken = signUserToken({ ...payload, officeId: office.id });

  const response = NextResponse.json({
    success: true,
    data: { id: office.id, name: office.name, code: office.code, collectionPoint: office.collectionPoint, address: office.address },
  });

  response.cookies.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
