import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyUserToken } from "@/lib/user-auth";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Auth — only the session owner can pay
    const cookieStore = await cookies();
    const token = cookieStore.get("chopdrop-user-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = verifyUserToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const session = await prisma.chopSession.findUnique({
      where: { shareCode: code },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Chop session not found" },
        { status: 404 }
      );
    }

    if (session.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Only the session owner can pay" },
        { status: 403 }
      );
    }

    if (session.status === "PAID" || session.paymentStatus === "SUCCESS") {
      return NextResponse.json(
        { success: false, error: "This session has already been paid" },
        { status: 400 }
      );
    }

    if (session.status !== "ACTIVE" && session.status !== "EXPIRED") {
      return NextResponse.json(
        { success: false, error: "This session cannot be paid for" },
        { status: 400 }
      );
    }

    // Calculate final amount
    const finalAmount =
      session.currentTotal + session.deliveryFee + session.serviceFee;
    const reference = `chop_${session.shareCode}_${Date.now()}`;

    // Get user email
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    if (!dbUser?.email) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 }
      );
    }

    // Initialize Paystack transaction
    const origin = new URL(request.url).origin;
    const paystack = await initializeTransaction({
      email: dbUser.email,
      amount: finalAmount,
      reference,
      callbackUrl: `${origin}/chop/${code}`,
    });

    // Save payment reference
    await prisma.chopSession.update({
      where: { id: session.id },
      data: { paymentRef: reference },
    });

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: paystack.data.authorization_url,
        reference,
        amount: finalAmount,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to initiate payment";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
