import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isToday(date: Date): boolean {
  const today = startOfToday();
  return date >= today;
}

// GET /api/rewards — full rewards summary for the rewards page
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  // Parallel fetch all rewards data
  const [wallet, poolCount, todayScratch, streak, creditTotals] = await Promise.all([
    // Wallet balance
    prisma.creditWallet.findUnique({ where: { userId: user.id } }),

    // Total pools joined
    prisma.poolMember.count({ where: { userId: user.id } }),

    // Today's scratch card
    prisma.scratchCard.findFirst({
      where: {
        userId: user.id,
        claimedAt: { gte: startOfToday() },
      },
    }),

    // Streak record
    prisma.streak.findUnique({ where: { userId: user.id } }),

    // Total earned and spent from credit transactions
    prisma.creditWallet.findUnique({
      where: { userId: user.id },
      include: {
        transactions: {
          select: { amount: true },
        },
      },
    }),
  ]);

  // Calculate total earned (positive) and total spent (negative)
  let totalEarned = 0;
  let totalSpent = 0;
  if (creditTotals?.transactions) {
    for (const tx of creditTotals.transactions) {
      if (tx.amount > 0) {
        totalEarned += tx.amount;
      } else {
        totalSpent += Math.abs(tx.amount);
      }
    }
  }

  const walletBalance = wallet?.balance ?? 0;
  const poolsJoined = poolCount;
  const points = poolsJoined * 20;

  const canScratch = !todayScratch;
  const todayPrize = todayScratch?.prize ?? null;

  const streakCurrent = streak?.current ?? 0;
  const streakLongest = streak?.longest ?? 0;
  const canCheckIn = !streak?.lastCheckIn || !isToday(streak.lastCheckIn);

  return NextResponse.json({
    success: true,
    data: {
      walletBalance,
      poolsJoined,
      points,
      streak: {
        current: streakCurrent,
        longest: streakLongest,
        canCheckIn,
      },
      scratch: {
        canScratch,
        todayPrize,
      },
      totalEarned,
      totalSpent,
    },
  });
}
