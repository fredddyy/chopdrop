import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "chopdrop-secret-key";

/**
 * POST /api/auth/reset-pin
 * Body: { token, pin }
 *
 * Validates the reset token and sets a new PIN.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, pin } = body;

  if (!token || !pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  let payload: { userId: string; phone: string; purpose: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as typeof payload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Reset link expired. Request a new one." },
      { status: 400 }
    );
  }

  if (payload.purpose !== "pin-reset") {
    return NextResponse.json(
      { success: false, error: "Invalid reset link." },
      { status: 400 }
    );
  }

  const pinHash = await bcryptjs.hash(pin, 10);

  await prisma.user.update({
    where: { id: payload.userId },
    data: { pinHash },
  });

  return NextResponse.json({
    success: true,
    data: { message: "PIN updated successfully" },
  });
}
