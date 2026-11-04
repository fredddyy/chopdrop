import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { calculateBegCredit, getTotalBegCredit, DEFAULT_BEG_CONFIG } from "@/lib/beg-price";
import type { BegPriceConfig } from "@/lib/beg-price";

async function loadConfig(): Promise<BegPriceConfig> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "beg-price-config" } });
    if (setting?.value && typeof setting.value === "object") return setting.value as unknown as BegPriceConfig;
  } catch { /* use defaults */ }
  return DEFAULT_BEG_CONFIG;
}

// GET /api/beg/[code] — public beg status (clicks, credit, product info)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const member = await prisma.poolMember.findFirst({
    where: { begCode: code },
    include: {
      pool: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true, groupPrice: true, retailPrice: true, minPoolSize: true, vendor: { select: { name: true } } } },
          members: { select: { id: true } },
        },
      },
      user: { select: { firstName: true } },
      begClicks: {
        include: { clicker: { select: { firstName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!member) return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });

  const config = await loadConfig();
  const { totalCredit, maxCredit, atMax } = getTotalBegCredit(member.begClicks.length, member.pool.product.groupPrice, config);

  return NextResponse.json({
    success: true,
    data: {
      sharerName: member.user.firstName,
      product: member.pool.product,
      poolId: member.poolId,
      poolStatus: member.pool.status,
      memberCount: member.pool.members.length,
      minSize: member.pool.minSize,
      clicks: member.begClicks.length,
      maxClicks: config.maxClicks,
      totalCredit,
      maxCredit,
      atMax,
      clickers: member.begClicks.map((c) => ({ name: c.clicker.firstName, amount: c.creditAmount })),
      shareUrl: `/b/${code}`,
    },
  });
}

// POST /api/beg/[code] — authenticated click → credit to sharer's wallet
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  // Require auth — only signed-up users count
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Sign up to help your friend save", needsAuth: true }, { status: 401 });
  const clicker = verifyToken(token);
  if (!clicker) return NextResponse.json({ success: false, error: "Invalid session", needsAuth: true }, { status: 401 });

  const member = await prisma.poolMember.findFirst({
    where: { begCode: code },
    include: {
      begClicks: true,
      pool: { include: { product: { select: { groupPrice: true } } } },
      user: { select: { firstName: true } },
    },
  });

  if (!member) return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });

  // Can't click your own link
  if (member.userId === clicker.id) {
    return NextResponse.json({ success: false, error: "Can't click your own link" }, { status: 400 });
  }

  const config = await loadConfig();
  if (!config.enabled) {
    return NextResponse.json({ success: false, error: "Beg Price is not available right now" }, { status: 400 });
  }

  // Check max clicks
  const { atMax } = getTotalBegCredit(member.begClicks.length, member.pool.product.groupPrice, config);
  if (atMax || member.begClicks.length >= config.maxClicks) {
    return NextResponse.json({ success: false, error: "Max credit reached", alreadyMax: true }, { status: 400 });
  }

  // Check if this user already clicked
  const existing = member.begClicks.find((c) => c.clickerUserId === clicker.id);
  if (existing) {
    return NextResponse.json({
      success: true,
      data: { alreadyClicked: true, sharerName: member.user.firstName, creditAmount: existing.creditAmount, productId: member.pool.productId, poolId: member.poolId },
    });
  }

  // Calculate credit for this click
  const creditAmount = calculateBegCredit(member.begClicks.length, config);

  // Transaction: create click + update member discount + add wallet credit
  await prisma.$transaction(async (tx) => {
    await tx.begClick.create({
      data: {
        poolMemberId: member.id,
        clickerUserId: clicker.id,
        creditAmount,
      },
    });

    await tx.poolMember.update({
      where: { id: member.id },
      data: { begDiscount: { increment: creditAmount } },
    });

    // Add credit to sharer's wallet
    const wallet = await tx.creditWallet.upsert({
      where: { userId: member.userId },
      update: { balance: { increment: creditAmount } },
      create: { userId: member.userId, balance: creditAmount },
    });

    // Link wallet to user if not linked
    await tx.user.update({
      where: { id: member.userId },
      data: { walletId: wallet.id },
    });

    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        amount: creditAmount,
        type: "BEG_CREDIT",
        description: `Beg Price click from ${clicker.id.slice(0, 6)}`,
      },
    });
  });

  return NextResponse.json({
    success: true,
    data: {
      sharerName: member.user.firstName,
      creditAmount,
      totalCredit: member.begDiscount + creditAmount,
      productId: member.pool.productId,
      poolId: member.poolId,
    },
  });
}
