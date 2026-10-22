import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

/**
 * GET /api/credits
 *
 * Returns the current user's credit wallet balance and recent transactions.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ success: true, data: { balance: 0, transactions: [] } });
    }

    let userId: string;
    try {
      const decoded = verify(token, process.env.JWT_SECRET || "chopdrop-dev-secret") as { userId: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ success: true, data: { balance: 0, transactions: [] } });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: {
          include: {
            transactions: {
              orderBy: { createdAt: "desc" },
              take: 20,
            },
          },
        },
      },
    });

    if (!user?.wallet) {
      return NextResponse.json({ success: true, data: { balance: 0, transactions: [] } });
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: user.wallet.balance,
        transactions: user.wallet.transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: { balance: 0, transactions: [] } });
  }
}
