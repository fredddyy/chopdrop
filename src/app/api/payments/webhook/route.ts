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

    // Route by payment reference prefix
    if (reference.startsWith("instant_")) {
      await handleInstantOrderPayment(reference, amount);
    } else {
      await handleLegacyOrderPayment(reference, amount);
    }
  }

  return NextResponse.json({ status: "ok" });
}

// Handle instant-buy product orders
async function handleInstantOrderPayment(reference: string, amount: number) {
  const order = await prisma.instantOrder.findFirst({
    where: { paymentRef: reference },
  });

  if (!order || order.paymentStatus === "SUCCESS") return;

  if (amount !== order.totalAmount) {
    await prisma.instantOrder.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED", status: "CANCELLED" },
    });
    return;
  }

  await prisma.instantOrder.update({
    where: { id: order.id },
    data: {
      paymentStatus: "SUCCESS",
      status: "CONFIRMED",
      paidAt: new Date(),
    },
  });
}

// Handle legacy food orders (chopdrop_ prefix or no prefix)
async function handleLegacyOrderPayment(reference: string, amount: number) {
  const order = await prisma.order.findFirst({
    where: { paymentRef: reference },
  });

  if (!order || order.paymentStatus === "SUCCESS") return;

  if (amount !== order.totalAmount) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED", status: "CANCELLED" },
    });
    return;
  }

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
