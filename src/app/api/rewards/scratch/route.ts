import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow(): Date {
  const today = startOfToday();
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
}

// Weighted random prize selection (kobo)
function pickPrize(): number {
  const prizes = [5000, 5000, 5000, 10000, 10000, 10000, 15000, 20000, 50000];
  return prizes[Math.floor(Math.random() * prizes.length)];
}

// GET /api/rewards/scratch — check if user can scratch today
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const todayCard = await prisma.scratchCard.findFirst({
    where: {
      userId: user.id,
      claimedAt: { gte: startOfToday() },
    },
  });

  const canScratch = !todayCard;
  const tomorrow = startOfTomorrow();

  return NextResponse.json({
    success: true,
    data: {
      canScratch,
      todayPrize: todayCard?.prize ?? null,
      nextScratchAt: canScratch ? null : tomorrow.toISOString(),
    },
  });
}

// POST /api/rewards/scratch — scratch today's card and claim prize
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  // Check if already scratched today
  const existing = await prisma.scratchCard.findFirst({
    where: {
      userId: user.id,
      claimedAt: { gte: startOfToday() },
    },
  });

  if (existing) {
    return NextResponse.json(
      { success: false, error: "You have already scratched today. Come back tomorrow!" },
      { status: 400 },
    );
  }

  const prize = pickPrize();

  // Create scratch card, credit wallet, and log transaction in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the scratch card record
    await tx.scratchCard.create({
      data: {
        userId: user.id,
        prize,
      },
    });

    // Find or create credit wallet
    let wallet = await tx.creditWallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      wallet = await tx.creditWallet.create({
        data: { userId: user.id, balance: 0 },
      });
    }

    // Create credit transaction
    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: prize,
        type: "SCRATCH_WIN",
        description: `Scratch card win — ₦${(prize / 100).toLocaleString()}`,
      },
    });

    // Increment wallet balance
    const updated = await tx.creditWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: prize } },
    });

    return { newBalance: updated.balance };
  });

  return NextResponse.json({
    success: true,
    data: {
      prize,
      newBalance: result.newBalance,
    },
  });
}
