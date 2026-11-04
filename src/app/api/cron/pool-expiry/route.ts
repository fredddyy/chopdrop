import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refundTransaction } from "@/lib/paystack";

// GET /api/cron/pool-expiry — expire overdue pools and refund paid members
// Schedule: every 15 minutes via Vercel cron
export async function GET() {
  const now = new Date();

  // Find all OPEN or FILLED pools past their deadline
  const expiredPools = await prisma.pool.findMany({
    where: {
      status: { in: ["OPEN", "FILLED"] },
      deadline: { lt: now },
    },
    include: {
      members: { where: { paymentStatus: "SUCCESS" } },
      product: { select: { name: true } },
    },
  });

  let expired = 0;
  let refunded = 0;
  const errors: string[] = [];

  for (const pool of expiredPools) {
    // Mark pool as EXPIRED
    await prisma.pool.update({
      where: { id: pool.id },
      data: { status: "EXPIRED" },
    });
    expired++;

    // Refund each paid member
    for (const member of pool.members) {
      if (!member.paymentRef) continue;

      try {
        await refundTransaction(member.paymentRef);
        await prisma.poolMember.update({
          where: { id: member.id },
          data: { paymentStatus: "PENDING" }, // Reset — refund issued
        });
        refunded++;
      } catch (err) {
        errors.push(`Refund failed for member ${member.id}: ${(err as Error).message}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      poolsExpired: expired,
      membersRefunded: refunded,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    },
  });
}
