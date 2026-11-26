import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // ── SAFEGUARD: Require logged-in user (phone-verified) ──
    const cookieStore = await cookies();
    const token = cookieStore.get("chopdrop-user-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Log in to chop a price" },
        { status: 401 }
      );
    }
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Log in to chop a price" },
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

    // ── SAFEGUARD: Can't chop your own session ──
    if (session.userId === user.id) {
      return NextResponse.json(
        { success: false, error: "You can't chop your own price — share the link with friends!" },
        { status: 400 }
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This chop session is no longer active" },
        { status: 400 }
      );
    }

    if (session.expiresAt < new Date()) {
      await prisma.chopSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { success: false, error: "This chop session has expired" },
        { status: 400 }
      );
    }

    if (session.currentChopCount >= session.maxChops) {
      return NextResponse.json(
        { success: false, error: "All chops have been used!" },
        { status: 400 }
      );
    }

    // ── SAFEGUARD: One chop per USER (not per IP) ──
    const existingChop = await prisma.chopClick.findFirst({
      where: { sessionId: session.id, chopperId: user.id },
    });

    if (existingChop) {
      return NextResponse.json(
        { success: false, error: "You already chopped this one!" },
        { status: 400 }
      );
    }

    // ── SAFEGUARD: Floor price — never go below 70% of retail (max 30% off) ──
    const floorPrice = Math.round(session.retailTotal * 0.7);
    const effectiveFloor = Math.max(session.groupFloor, floorPrice);

    // Progressive chop — first person chops the most, each subsequent chop is smaller
    const totalShares = Array.from({ length: session.maxChops }, (_, i) => session.maxChops - i).reduce((a, b) => a + b, 0);
    const chopNumber = session.currentChopCount + 1;
    const sharesForThisChop = session.maxChops - chopNumber + 1;
    const totalSavings = session.retailTotal - effectiveFloor;
    const progressiveAmount = Math.round((sharesForThisChop / totalShares) * totalSavings);
    const chopAmount = Math.min(
      Math.max(progressiveAmount, 1000), // at least ₦10
      session.currentTotal - effectiveFloor
    );

    if (chopAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Price is already at the lowest!" },
        { status: 400 }
      );
    }

    // Get user name for display
    const chopperUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true },
    });
    const chopperName = chopperUser ? `${chopperUser.firstName || ""} ${chopperUser.lastName || ""}`.trim() || "Friend" : "Friend";

    // IP hash as backup tracking
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ipHash = require("crypto").createHash("sha256").update(ip).digest("hex");

    // ── Create click + update session + credit chopper atomically ──
    const [click, updatedSession] = await prisma.$transaction([
      prisma.chopClick.create({
        data: {
          sessionId: session.id,
          chopperName,
          chopperId: user.id,
          ipHash,
          amount: chopAmount,
        },
      }),
      prisma.chopSession.update({
        where: { id: session.id },
        data: {
          currentChopCount: { increment: 1 },
          currentTotal: { decrement: chopAmount },
        },
      }),
    ]);

    // ── SAFEGUARD: Give chopper ₦50 credit (non-blocking) ──
    const CHOP_REWARD = 5000; // 50 naira in kobo
    try {
      await prisma.creditWallet.upsert({
        where: { userId: user.id },
        update: { balance: { increment: CHOP_REWARD } },
        create: { userId: user.id, balance: CHOP_REWARD },
      });
      await prisma.creditTransaction.create({
        data: {
          walletId: (await prisma.creditWallet.findUnique({ where: { userId: user.id } }))!.id,
          amount: CHOP_REWARD,
          type: "CREDIT",
          description: `Chop reward for helping ${session.shareCode}`,
        },
      });
    } catch {
      // Non-critical — don't fail the chop if credit fails
    }

    return NextResponse.json({
      success: true,
      data: {
        chopAmount: click.amount,
        newTotal: updatedSession.currentTotal,
        chopperName,
        totalChops: updatedSession.currentChopCount,
        maxChops: updatedSession.maxChops,
        rewardCredit: CHOP_REWARD,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process chop";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
