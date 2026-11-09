import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users/[id] — full user detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
      wallet: {
        select: {
          id: true,
          balance: true,
          transactions: {
            select: {
              id: true,
              amount: true,
              type: true,
              description: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
      poolMemberships: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalAmount: true,
          paymentStatus: true,
          createdAt: true,
          pool: {
            select: {
              id: true,
              name: true,
              status: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { poolMemberships: true, orders: true } },
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: user });
}

// PATCH /api/admin/users/[id] — update role or adjust wallet
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Role update
  if (body.role) {
    if (!["USER", "CAPTAIN"].includes(body.role)) {
      return NextResponse.json(
        { success: false, error: "Role must be USER or CAPTAIN" },
        { status: 400 }
      );
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, firstName: true, phone: true, role: true },
    });
    return NextResponse.json({ success: true, data: user });
  }

  // Wallet adjustment
  if (body.walletAdjustment !== undefined) {
    const amount = Math.round(Number(body.walletAdjustment));
    if (isNaN(amount) || amount === 0) {
      return NextResponse.json(
        { success: false, error: "walletAdjustment must be a non-zero number (kobo)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { walletId: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    let walletId = user.walletId;

    // Create wallet if it doesn't exist
    if (!walletId) {
      const wallet = await prisma.creditWallet.create({
        data: { userId: id, balance: 0 },
      });
      walletId = wallet.id;
      await prisma.user.update({
        where: { id },
        data: { walletId: wallet.id },
      });
    }

    // Create transaction and update balance atomically
    await prisma.creditTransaction.create({
      data: {
        walletId,
        amount,
        type: "MANUAL",
        description: body.description || "Manual adjustment by ops",
      },
    });

    const wallet = await prisma.creditWallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } },
    });

    return NextResponse.json({
      success: true,
      data: { walletId, newBalance: wallet.balance },
    });
  }

  return NextResponse.json(
    { success: false, error: "No valid update provided" },
    { status: 400 }
  );
}
