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
    if (reference.startsWith("pool_")) {
      await handlePoolPayment(reference, amount);
    } else if (reference.startsWith("go_")) {
      await handleGroupOrderPayment(reference, amount);
    } else if (reference.startsWith("instant_")) {
      await handleInstantOrderPayment(reference, amount);
    } else if (reference.startsWith("chop_")) {
      await handleChopPayment(reference);
    } else {
      await handleLegacyOrderPayment(reference, amount);
    }
  }

  return NextResponse.json({ status: "ok" });
}

// Handle group order member payments
async function handleGroupOrderPayment(reference: string, amount: number) {
  const member = await prisma.groupOrderMember.findFirst({
    where: { paymentRef: reference },
  });

  if (!member || member.paymentStatus === "SUCCESS") return;

  const expectedAmount = member.subtotal + member.deliveryShare;
  if (amount !== expectedAmount) {
    await prisma.groupOrderMember.update({
      where: { id: member.id },
      data: { paymentStatus: "FAILED" },
    });
    return;
  }

  await prisma.groupOrderMember.update({
    where: { id: member.id },
    data: { paymentStatus: "SUCCESS", paidAt: new Date() },
  });
}

// Handle pool member payments
async function handlePoolPayment(reference: string, amount: number) {
  const member = await prisma.poolMember.findFirst({
    where: { paymentRef: reference },
    include: { pool: { include: { members: true } } },
  });

  if (!member || member.paymentStatus === "SUCCESS") return;

  const expectedAmount = member.totalAmount + member.deliveryFee;
  if (amount !== expectedAmount) {
    await prisma.poolMember.update({
      where: { id: member.id },
      data: { paymentStatus: "FAILED" },
    });
    return;
  }

  await prisma.poolMember.update({
    where: { id: member.id },
    data: { paymentStatus: "SUCCESS", paidAt: new Date() },
  });

  // Check if ALL members in the pool have now paid
  const allMembers = member.pool.members;
  const paidCount = allMembers.filter((m) => m.id === member.id ? true : m.paymentStatus === "SUCCESS").length;

  if (paidCount >= allMembers.length && member.pool.status === "FILLED") {
    // All members paid → pool is complete, ready for dispatch
    await prisma.pool.update({
      where: { id: member.poolId },
      data: { status: "COMPLETED" },
    });
  }
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

async function handleChopPayment(reference: string) {
  const session = await prisma.chopSession.findFirst({
    where: { paymentRef: reference },
  });
  if (!session) return;
  if (session.paymentStatus === "SUCCESS") return; // idempotent

  await prisma.chopSession.update({
    where: { id: session.id },
    data: {
      paymentStatus: "SUCCESS",
      status: "PAID",
      paidAt: new Date(),
    },
  });
}
