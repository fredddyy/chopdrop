import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

const JWT_SECRET = process.env.JWT_SECRET || "chopdrop-secret-key";
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || "2349120532827";

/**
 * POST /api/auth/forgot-pin
 * Body: { phone }
 *
 * Generates a signed reset link and returns a WhatsApp URL
 * that pre-fills a message to the admin with user details + reset link.
 */
export async function POST(request: NextRequest) {
  const ip = getRateLimitKey(request);
  const limit = rateLimit(`forgotpin:${ip}`, 3, 60000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Wait a minute." },
      { status: 429 }
    );
  }

  const body = await request.json();
  let phone = body.phone?.trim()?.replace(/\s/g, "");

  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { success: false, error: "Enter a valid phone number" },
      { status: 400 }
    );
  }

  // Normalize
  if (phone.startsWith("0")) phone = "234" + phone.slice(1);
  if (!phone.startsWith("234")) phone = "234" + phone;

  const user = await prisma.user.findFirst({
    where: { phone },
    include: { office: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "No account with this number." },
      { status: 404 }
    );
  }

  // Generate signed reset token — valid for 1 hour
  const resetToken = jwt.sign(
    { userId: user.id, phone, purpose: "pin-reset" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Build reset URL — user clicks this to set a new PIN
  const origin = request.nextUrl.origin;
  const resetUrl = `${origin}/auth/reset-pin?token=${resetToken}`;

  // Build WhatsApp message to admin
  const adminMessage = encodeURIComponent(
    `PIN Reset Request\n\nName: ${user.firstName}\nPhone: ${phone}\nOffice: ${user.office?.name || "No office"}\n\nSend this link to the user:\n${resetUrl}`
  );
  const adminWhatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${adminMessage}`;

  // Also build a direct WhatsApp link for the user (admin forwards the reset link)
  return NextResponse.json({
    success: true,
    data: {
      adminWhatsappUrl,
      message: "We've prepared a reset request. Tap the button to send it via WhatsApp.",
    },
  });
}
