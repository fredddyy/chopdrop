import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGroupTiers, getGroupDiscount, calculateSettlement } from "@/lib/group-tier-pricing";

/**
 * GET /api/cron/settle-group-orders
 *
 * Settles restaurant-level tier discounts for closed group orders.
 * For each unsettled group order past its deadline:
 * 1. Count paid members
 * 2. Look up restaurant's groupTiers
 * 3. Calculate discount% from tiers
 * 4. Credit each paid member's wallet with their share
 * 5. Mark order as settled
 *
 * Can be triggered by Vercel Cron or manually.
 */
export async function GET() {
  try {
    const now = new Date();

    // Find all group orders past deadline that haven't been settled
    const orders = await prisma.groupOrder.findMany({
      where: {
        settled: false,
        deadline: { lt: now },
        status: { notIn: ["CANCELLED"] },
      },
      include: {
        restaurant: { select: { name: true, groupTiers: true } },
        members: {
          where: { paymentStatus: "SUCCESS" },
          select: { id: true, userId: true, subtotal: true },
        },
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({ success: true, message: "No group orders to settle", settled: 0, credits: 0 });
    }

    let totalSettled = 0;
    let totalCreditsIssued = 0;

    for (const order of orders) {
      const tiers = parseGroupTiers(order.restaurant.groupTiers);
      const paidCount = order.members.length;
      const { discount } = getGroupDiscount(tiers, paidCount);

      if (discount <= 0 || paidCount === 0) {
        // No tier reached — mark settled with no credits
        await prisma.groupOrder.update({
          where: { id: order.id },
          data: { settled: true, settledAt: now },
        });
        totalSettled++;
        continue;
      }

      // Credit each paid member
      for (const member of order.members) {
        const refundAmount = calculateSettlement(member.subtotal, discount);
        if (refundAmount <= 0) continue;

        // Find or create wallet
        let wallet = await prisma.creditWallet.findUnique({ where: { userId: member.userId } });
        if (!wallet) {
          wallet = await prisma.creditWallet.create({ data: { userId: member.userId, balance: 0 } });
        }

        await prisma.$transaction([
          prisma.creditWallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: refundAmount } },
          }),
          prisma.creditTransaction.create({
            data: {
              walletId: wallet.id,
              amount: refundAmount,
              type: "GROUP_DISCOUNT",
              description: `Group order: ${paidCount} people at ${order.restaurant.name} → ${discount}% off`,
            },
          }),
        ]);

        totalCreditsIssued += refundAmount;
      }

      // Mark order as settled
      await prisma.groupOrder.update({
        where: { id: order.id },
        data: { settled: true, settledAt: now },
      });
      totalSettled++;
    }

    return NextResponse.json({
      success: true,
      message: `Settled ${totalSettled} group orders, issued ₦${(totalCreditsIssued / 100).toLocaleString()} in credits`,
      settled: totalSettled,
      totalCreditsIssued,
      totalCreditsFormatted: `₦${(totalCreditsIssued / 100).toLocaleString()}`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
