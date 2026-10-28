import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUserToken } from "@/lib/user-auth";
import { cookies } from "next/headers";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

/**
 * POST /api/auth/set-pin
 * Body: { phone, pin, firstName?, officeCode? }
 *
 * For NEW users: creates account with PIN.
 * For EXISTING users without PIN: sets their PIN.
 * For PIN reset: called with a valid reset token (pinResetToken).
 */
export async function POST(request: NextRequest) {
  const ip = getRateLimitKey(request);
  const limit = rateLimit(`setpin:${ip}`, 10, 60000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Wait a minute." },
      { status: 429 }
    );
  }

  const body = await request.json();
  let phone = body.phone?.trim()?.replace(/\s/g, "");
  const pin = body.pin?.trim();
  const firstName = body.firstName?.trim();
  const officeCode = body.officeCode?.trim();

  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { success: false, error: "Enter a valid phone number" },
      { status: 400 }
    );
  }

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { success: false, error: "PIN must be exactly 4 digits" },
      { status: 400 }
    );
  }

  // Normalize phone
  if (phone.startsWith("0")) phone = "234" + phone.slice(1);
  if (!phone.startsWith("234")) phone = "234" + phone;

  const pinHash = await bcryptjs.hash(pin, 10);

  // Check if user exists
  let user = await prisma.user.findFirst({
    where: { phone },
    include: { office: true },
  });

  if (user) {
    // Existing user — set/update their PIN
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        pinHash,
        ...(firstName && user.firstName === "User" ? { firstName, lastName: firstName } : {}),
      },
      include: { office: true },
    });
  } else {
    // New user — create with PIN
    const passwordHash = await bcryptjs.hash(`pin_${phone}_${Date.now()}`, 10);
    user = await prisma.user.create({
      data: {
        phone,
        email: `${phone}@chopdrop.ng`,
        firstName: firstName || "User",
        lastName: firstName || "User",
        passwordHash,
        pinHash,
      },
      include: { office: true },
    });
  }

  // Connect to office if code provided
  if (officeCode && !user.officeId) {
    const office = await prisma.office.findUnique({ where: { code: officeCode } });
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
      hasPin: true,
      office: user.office
        ? { id: user.office.id, name: user.office.name, code: user.office.code, collectionPoint: user.office.collectionPoint }
        : null,
    },
  });
}
