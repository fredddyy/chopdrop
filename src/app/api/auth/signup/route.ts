import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signUserToken, COOKIE_NAME } from "@/lib/user-auth";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getRateLimitKey(request);
  const limit = rateLimit(`signup:${ip}`, 5, 60000);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await request.json();
  const { firstName, lastName, email, phone, password } = body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !password) {
    return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // Check existing
  const existingEmail = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existingEmail) {
    return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone: phone.trim() } });
  if (existingPhone) {
    return NextResponse.json({ success: false, error: "Phone number already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      passwordHash,
    },
  });

  const token = signUserToken({
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    officeId: user.officeId || undefined,
  });

  const response = NextResponse.json({
    success: true,
    data: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone },
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
