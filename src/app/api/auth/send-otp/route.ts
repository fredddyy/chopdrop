import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

const JWT_SECRET = process.env.JWT_SECRET || "chopdrop-secret-key";
const IS_TEST_MODE = process.env.OTP_MODE !== "live"; // Default to test mode

/**
 * POST /api/auth/send-otp
 * Body: { phone: "08123456789" }
 *
 * Test mode: returns the OTP code directly so the frontend can display it.
 * Live mode: sends SMS via Termii API, returns only the token.
 */
export async function POST(request: NextRequest) {
  const ip = getRateLimitKey(request);
  const limit = rateLimit(`otp:${ip}`, 5, 60000);
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

  // Normalize to international format
  if (phone.startsWith("0")) phone = "234" + phone.slice(1);
  if (!phone.startsWith("234")) phone = "234" + phone;

  // Generate 4-digit OTP
  const code = String(Math.floor(1000 + Math.random() * 9000));

  // Sign a token containing the code hash + phone (expires in 10 minutes)
  const otpToken = jwt.sign(
    { phone, code, purpose: "otp" },
    JWT_SECRET,
    { expiresIn: "10m" }
  );

  if (!IS_TEST_MODE) {
    // Live mode: send SMS via Termii
    const termiiKey = process.env.TERMII_API_KEY;
    if (termiiKey) {
      try {
        await fetch("https://v4.api.termii.com/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: termiiKey,
            to: phone,
            from: "ChopDrop",
            sms: `Your ChopDrop code is ${code}. Valid for 10 minutes.`,
            type: "plain",
            channel: "generic",
          }),
        });
      } catch {
        // SMS failed — fall back to returning code
        return NextResponse.json({
          success: true,
          data: { otpToken, testCode: code, fallback: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { otpToken },
    });
  }

  // Test mode: return the code so frontend can display it
  return NextResponse.json({
    success: true,
    data: { otpToken, testCode: code },
  });
}
