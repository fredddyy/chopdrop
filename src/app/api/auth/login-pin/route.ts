import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUserToken } from "@/lib/user-auth";
import { cookies } from "next/headers";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

/**
 * POST /api/auth/login-pin
 * Body: { phone, pin }
 *
 * Verifies PIN, signs auth token, sets cookie.
 */
export async function POST(request: NextRequest) {
  const ip = getRateLimitKey(request);
  const limit = rateLimit(`loginpin:${ip}`, 5, 60000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Wait a minute." },
      { status: 429 }
    );
  }

  const body = await request.json();
  let phone = body.phone?.trim()?.replace(/\s/g, "");
  const pin = body.pin?.trim();

  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { success: false, error: "Enter a valid phone number" },
      { status: 400 }
    );
  }

  if (!pin || pin.length !== 4) {
    return NextResponse.json(
      { success: false, error: "Enter your 4-digit PIN" },
      { status: 400 }
    );
  }

  // Normalize phone
  if (phone.startsWith("0")) phone = "234" + phone.slice(1);
  if (!phone.startsWith("234")) phone = "234" + phone;

  const user = await prisma.user.findFirst({
    where: { phone },
    include: { office: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "No account with this number. Sign up first." },
      { status: 404 }
    );
  }

  if (!user.pinHash) {
    return NextResponse.json(
      { success: false, error: "No PIN set. Please sign up again to create one.", needsSetup: true },
      { status: 400 }
    );
  }

  const valid = await bcryptjs.compare(pin, user.pinHash);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: "Wrong PIN. Try again." },
      { status: 401 }
    );
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
    },
  });
}
