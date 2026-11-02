import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/instant-orders/[orderCode] — order status
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = await params;

  const order = await prisma.instantOrder.findUnique({
    where: { orderCode },
    include: {
      product: {
        include: { vendor: { select: { id: true, name: true, imageUrl: true, address: true } } },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      deliveryFee: order.deliveryFee,
      serviceFee: order.serviceFee,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      product: {
        id: order.product.id,
        name: order.product.name,
        imageUrl: order.product.imageUrl,
        category: order.product.category,
      },
      vendor: order.product.vendor,
    },
  });
}
