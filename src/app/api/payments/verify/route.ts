import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { success: false, error: "Reference is required" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findFirst({
    where: { paymentRef: reference },
  });

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  // Already processed by webhook
  if (order.paymentStatus === "SUCCESS") {
    return NextResponse.json({
      success: true,
      data: { status: order.status, paymentStatus: order.paymentStatus },
    });
  }

  // Verify with Paystack
  const verification = await verifyTransaction(reference);

  if (verification.data.status === "success") {
    // Verify amount
    if (verification.data.amount !== order.totalAmount) {
      return NextResponse.json(
        { success: false, error: "Amount mismatch" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "SUCCESS",
          status: "CONFIRMED",
          paidAt: new Date(verification.data.paid_at),
        },
      });

      await tx.dailyMenu.update({
        where: { id: order.dailyMenuId },
        data: { currentOrders: { increment: order.quantity } },
      });
    });

    return NextResponse.json({
      success: true,
      data: { status: "CONFIRMED", paymentStatus: "SUCCESS" },
    });
  }

  return NextResponse.json({
    success: true,
    data: { status: order.status, paymentStatus: order.paymentStatus },
  });
}
