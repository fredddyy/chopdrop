import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePoolTiers, getPoolPrice } from "@/lib/pool-pricing";

/**
 * POST /api/cron/settle-pool
 *
 * Runs after pool closes. For each office+slot:
 * 1. Count total paid orders
 * 2. Calculate final tier discount
 * 3. For each order: credit the difference between paid price and final pool price
 * 4. Mark orders as poolRefunded
 *
 * Can be triggered by Vercel Cron or manually.
 */
export async function POST() {
  try {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const today = new Date(todayStr + "T00:00:00.000Z");
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all paid orders today that haven't been refunded yet
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "SUCCESS",
        poolRefunded: false,
        createdAt: { gte: today, lte: endOfDay },
        officeId: { not: null },
      },
      include: {
        dailyMenu: { include: { meal: true, timeSlot: true } },
        user: true,
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({ success: true, message: "No orders to settle", credits: 0 });
    }

    // Group by office + time slot
    const groups = new Map<string, typeof orders>();
    for (const order of orders) {
      const key = `${order.officeId}-${order.dailyMenu.timeSlotId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(order);
    }

    let totalCreditsIssued = 0;
    let ordersSettled = 0;

    for (const [, groupOrders] of groups) {
      const officeOrderCount = groupOrders.length;

      for (const order of groupOrders) {
        const meal = order.dailyMenu.meal;
        const tiers = parsePoolTiers((meal as Record<string, unknown>).poolTiers);

        if (tiers.length === 0) {
          // No pool tiers — mark as settled, no credit
          await prisma.order.update({ where: { id: order.id }, data: { poolRefunded: true } });
          ordersSettled++;
          continue;
        }

        // Calculate what the price SHOULD be at the final tier
        const result = getPoolPrice(meal.price, tiers, officeOrderCount);
        const finalPrice = result.price;
        const paidPerUnit = Math.round(order.totalAmount / order.quantity);
        const creditPerUnit = Math.max(0, paidPerUnit - finalPrice);
        const totalCredit = creditPerUnit * order.quantity;

        if (totalCredit <= 0 || !order.userId) {
          // No savings or no user — mark settled
          await prisma.order.update({ where: { id: order.id }, data: { poolRefunded: true } });
          ordersSettled++;
          continue;
        }

        // Find or create wallet for this user
        const user = await prisma.user.findUnique({ where: { id: order.userId }, include: { wallet: true } });
        let wallet = user?.wallet;

        if (!wallet) {
          wallet = await prisma.creditWallet.create({ data: { userId: order.userId } });
          await prisma.user.update({ where: { id: order.userId }, data: { walletId: wallet.id } });
        }

        // Credit the wallet
        await prisma.$transaction([
          prisma.creditWallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: totalCredit } },
          }),
          prisma.creditTransaction.create({
            data: {
              walletId: wallet.id,
              orderId: order.id,
              amount: totalCredit,
              type: "POOL_REFUND",
              description: `Pool credit: ${officeOrderCount} orders → ${Math.round((1 - finalPrice / meal.price) * 100)}% off ${meal.name}`,
            },
          }),
          prisma.order.update({
            where: { id: order.id },
            data: { poolRefunded: true },
          }),
        ]);

        totalCreditsIssued += totalCredit;
        ordersSettled++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Settled ${ordersSettled} orders, issued ${totalCreditsIssued} kobo in credits`,
      ordersSettled,
      totalCreditsIssued,
      totalCreditsFormatted: `₦${(totalCreditsIssued / 100).toLocaleString()}`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// Also allow GET for easy testing
export async function GET() {
  return POST();
}
