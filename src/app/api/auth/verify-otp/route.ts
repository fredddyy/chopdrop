import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUserToken } from "@/lib/user-auth";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "chopdrop-secret-key";

/**
 * POST /api/auth/verify-otp
 * Body: { otpToken, code, firstName, officeCode? }
 *
 * Verifies the OTP, creates user if new (or signs in if existing),
 * and optionally connects to an office.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { otpToken, code, firstName, officeCode } = body;

  if (!otpToken || !code) {
    return NextResponse.json(
      { success: false, error: "Missing verification data" },
      { status: 400 }
    );
  }

  // Verify the OTP token
  let payload: { phone: string; code: string; purpose: string };
  try {
    payload = jwt.verify(otpToken, JWT_SECRET) as typeof payload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Code expired. Request a new one." },
      { status: 400 }
    );
  }

  if (payload.purpose !== "otp" || payload.code !== code) {
    return NextResponse.json(
      { success: false, error: "Wrong code. Try again." },
      { status: 400 }
    );
  }

  const phone = payload.phone;

  // Check if user already exists with this phone
  let user = await prisma.user.findFirst({
    where: { phone },
    include: { office: true },
  });

  if (!user) {
    // Create new user — no password needed for OTP users
    // Use a random password hash as placeholder
    const randomHash = await bcryptjs.hash(`otp_${phone}_${Date.now()}`, 10);

    user = await prisma.user.create({
      data: {
        phone,
        email: `${phone}@chopdrop.ng`,
        firstName: firstName?.trim() || "User",
        lastName: firstName?.trim() || "User",
        passwordHash: randomHash,
      },
      include: { office: true },
    });
  } else if (firstName?.trim() && user.firstName === "User") {
    // Update name if it was a placeholder
    user = await prisma.user.update({
      where: { id: user.id },
      data: { firstName: firstName.trim(), lastName: firstName.trim() },
      include: { office: true },
    });
  }

  // Connect to office if code provided and user isn't already in one
  if (officeCode && !user.officeId) {
    const office = await prisma.office.findUnique({
      where: { code: officeCode },
    });
    if (office) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { officeId: office.id },
        include: { office: true },
      });
    }
  }

  // Sign auth token and set cookie
  const token = signUserToken({
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    officeId: user.officeId || undefined,
  });

  const cookieStore = await cookies();
  cookieStore.set("chopdrop-user-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      firstName: user.firstName,
      phone: user.phone,
      office: user.office
        ? { id: user.office.id, name: user.office.name, code: user.office.code, collectionPoint: user.office.collectionPoint }
        : null,
      isNew: !user.office,
    },
  });
}
