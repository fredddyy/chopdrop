import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfYesterday(): Date {
  const today = startOfToday();
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
}

function isToday(date: Date): boolean {
  const today = startOfToday();
  return date >= today;
}

function isYesterday(date: Date): boolean {
  const yesterday = startOfYesterday();
  const today = startOfToday();
  return date >= yesterday && date < today;
}

// GET /api/rewards/streak — get user's streak info
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  let streak = await prisma.streak.findUnique({ where: { userId: user.id } });

  if (!streak) {
    streak = await prisma.streak.create({
      data: { userId: user.id, current: 0, longest: 0 },
    });
  }

  const canCheckIn = !streak.lastCheckIn || !isToday(streak.lastCheckIn);

  return NextResponse.json({
    success: true,
    data: {
      current: streak.current,
      longest: streak.longest,
      lastCheckIn: streak.lastCheckIn?.toISOString() ?? null,
      canCheckIn,
    },
  });
}

// POST /api/rewards/streak — check in for today
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  let streak = await prisma.streak.findUnique({ where: { userId: user.id } });

  if (!streak) {
    streak = await prisma.streak.create({
      data: { userId: user.id, current: 0, longest: 0 },
    });
  }

  // Already checked in today
  if (streak.lastCheckIn && isToday(streak.lastCheckIn)) {
    return NextResponse.json(
      { success: false, error: "Already checked in today" },
      { status: 400 },
    );
  }

  // Calculate new streak
  let newCurrent: number;
  if (streak.lastCheckIn && isYesterday(streak.lastCheckIn)) {
    // Consecutive day — increment
    newCurrent = streak.current + 1;
  } else {
    // Streak broken or first check-in — reset to 1
    newCurrent = 1;
  }

  const newLongest = Math.max(newCurrent, streak.longest);
  let bonusAwarded = false;

  // Award streak bonus at 7-day milestone
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.streak.update({
      where: { userId: user.id },
      data: {
        current: newCurrent,
        longest: newLongest,
        lastCheckIn: new Date(),
      },
    });

    // Award ₦100 (10000 kobo) bonus when hitting a 7-day streak
    if (newCurrent === 7) {
      let wallet = await tx.creditWallet.findUnique({ where: { userId: user.id } });
      if (!wallet) {
        wallet = await tx.creditWallet.create({
          data: { userId: user.id, balance: 0 },
        });
      }

      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          amount: 10000,
          type: "STREAK_BONUS",
          description: "7-day streak bonus — ₦100",
        },
      });

      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: 10000 } },
      });

      bonusAwarded = true;
    }

    return updated;
  });

  return NextResponse.json({
    success: true,
    data: {
      current: result.current,
      longest: result.longest,
      bonusAwarded,
    },
  });
}
