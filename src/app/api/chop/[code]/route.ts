import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const session = await prisma.chopSession.findUnique({
      where: { shareCode: code },
      include: {
        chops: { orderBy: { createdAt: "asc" } },
        user: { select: { firstName: true } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Chop session not found" },
        { status: 404 }
      );
    }

    // Auto-expire if past deadline
    if (session.status === "ACTIVE" && session.expiresAt < new Date()) {
      await prisma.chopSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });
      session.status = "EXPIRED";
    }

    return NextResponse.json({
      success: true,
      data: {
        shareCode: session.shareCode,
        status: session.status,
        retailTotal: session.retailTotal,
        groupFloor: session.groupFloor,
        currentTotal: session.currentTotal,
        chopAmountPerClick: session.chopAmountPerClick,
        currentChopCount: session.currentChopCount,
        maxChops: session.maxChops,
        expiresAt: session.expiresAt,
        serviceFee: session.serviceFee,
        cartSnapshot: session.cartSnapshot,
        ownerFirstName: session.user.firstName,
        choppers: session.chops.map((c) => ({
          name: c.chopperName,
          amount: c.amount,
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch chop session";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
