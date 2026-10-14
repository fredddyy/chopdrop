import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { reference, amount } = event.data;

    const order = await prisma.order.findFirst({
      where: { paymentRef: reference },
    });

    if (!order) {
      return NextResponse.json({ status: "ok" });
    }

    // Idempotent — skip if already processed
    if (order.paymentStatus === "SUCCESS") {
      return NextResponse.json({ status: "ok" });
    }

    // Verify amount matches
    if (amount !== order.totalAmount) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });
      return NextResponse.json({ status: "amount_mismatch" });
    }

    // Atomic update: confirm order and increment capacity
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "SUCCESS",
          status: "CONFIRMED",
          paidAt: new Date(),
        },
      });

      await tx.dailyMenu.update({
        where: { id: order.dailyMenuId },
        data: { currentOrders: { increment: order.quantity } },
      });
    });
  }

  return NextResponse.json({ status: "ok" });
}
