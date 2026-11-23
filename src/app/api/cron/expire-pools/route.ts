import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refundTransaction, verifyTransaction } from "@/lib/paystack";

// GET /api/cron/expire-pools — called by Vercel Cron or manually
// Finds expired unfilled pools, marks them EXPIRED, refunds members
export async function GET(request: NextRequest) {
  // Optional: verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let expiredCount = 0;
  let refundedCount = 0;
  const errors: string[] = [];

  // Find all OPEN pools past their deadline
  const expiredPools = await prisma.pool.findMany({
    where: {
      status: "OPEN",
      deadline: { lt: now },
    },
    include: {
      members: { select: { id: true, userId: true, paymentRef: true, paymentStatus: true, totalAmount: true } },
    },
  });

  for (const pool of expiredPools) {
    const memberCount = pool.members.length;

    if (memberCount < pool.minSize) {
      // Pool didn't fill — expire and refund all members
      await prisma.pool.update({
        where: { id: pool.id },
        data: { status: "EXPIRED" },
      });
      expiredCount++;

      // Refund each member who paid
      for (const member of pool.members) {
        if (member.paymentRef && member.paymentStatus === "PAID") {
          try {
            await refundTransaction(member.paymentRef);
            await prisma.poolMember.update({
              where: { id: member.id },
              data: { paymentStatus: "REFUNDED" },
            });
            refundedCount++;
          } catch (err) {
            errors.push(`Refund failed for member ${member.id}: ${err instanceof Error ? err.message : "unknown"}`);
          }
        }
        // Also try refunding via InstantOrder payment refs
        if (!member.paymentRef) {
          const instantOrder = await prisma.instantOrder.findFirst({
            where: { userId: member.userId, paymentStatus: "PENDING" },
            orderBy: { createdAt: "desc" },
            select: { id: true, paymentRef: true },
          });
          if (instantOrder?.paymentRef) {
            try {
              // Verify payment was actually made before refunding
              const verification = await verifyTransaction(instantOrder.paymentRef);
              if (verification.data.status === "success") {
                await refundTransaction(instantOrder.paymentRef);
                await prisma.instantOrder.update({
                  where: { id: instantOrder.id },
                  data: { paymentStatus: "REFUNDED" },
                });
                refundedCount++;
              }
            } catch (err) {
              errors.push(`InstantOrder refund failed for user ${member.userId}: ${err instanceof Error ? err.message : "unknown"}`);
            }
          }
        }
      }
    } else {
      // Pool filled — mark as COMPLETED
      await prisma.pool.update({
        where: { id: pool.id },
        data: { status: "FILLED" },
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      checkedPools: expiredPools.length,
      expiredCount,
      refundedCount,
      errors: errors.length > 0 ? errors : undefined,
    },
  });
}
