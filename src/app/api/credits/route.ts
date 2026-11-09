import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

/**
 * GET /api/credits
 *
 * Returns the current user's credit wallet balance and recent transactions.
 */
export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: true, data: { balance: 0, transactions: [] } });
    }

    const wallet = await prisma.creditWallet.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ success: true, data: { balance: 0, transactions: [] } });
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: wallet.balance,
        transactions: wallet.transactions.map((t) => ({
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
