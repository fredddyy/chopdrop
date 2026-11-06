import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// GET /api/wallet/transactions — list wallet transactions for the authenticated user
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: user.id },
  });

  if (!wallet) {
    return NextResponse.json({
      success: true,
      data: [],
      balance: 0,
    });
  }

  const transactions = await prisma.creditTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    success: true,
    data: transactions,
    balance: wallet.balance,
  });
}
