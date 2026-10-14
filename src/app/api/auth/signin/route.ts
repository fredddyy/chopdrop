import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signUserToken, COOKIE_NAME } from "@/lib/user-auth";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 10 attempts per minute per IP
  const ip = getRateLimitKey(request);
  const limit = rateLimit(`signin:${ip}`, 10, 60000);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await request.json();
  const { email, password } = body;

  if (!email?.trim() || !password) {
    return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { office: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
  }

  const token = signUserToken({
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    officeId: user.officeId || undefined,
  });

  const response = NextResponse.json({
    success: true,
    data: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      office: user.office ? { id: user.office.id, name: user.office.name, code: user.office.code, collectionPoint: user.office.collectionPoint } : null,
    },
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
