import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
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

    // Hash IP for dedup
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex");

    // Check for existing chop from this IP
    const existingChop = await prisma.chopClick.findUnique({
      where: { sessionId_ipHash: { sessionId: session.id, ipHash } },
    });

    if (existingChop) {
      return NextResponse.json(
        { success: false, error: "You already chopped this one!" },
        { status: 400 }
      );
    }

    // Calculate actual chop amount (never go below floor)
    const chopAmount = Math.min(
      session.chopAmountPerClick,
      session.currentTotal - session.groupFloor
    );

    if (chopAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Price is already at the lowest!" },
        { status: 400 }
      );
    }

    // Create click + update session atomically
    const [click, updatedSession] = await prisma.$transaction([
      prisma.chopClick.create({
        data: {
          sessionId: session.id,
          chopperName: name.trim(),
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

    return NextResponse.json({
      success: true,
      data: {
        chopAmount: click.amount,
        newTotal: updatedSession.currentTotal,
        chopperName: name.trim(),
        totalChops: updatedSession.currentChopCount,
        maxChops: updatedSession.maxChops,
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
