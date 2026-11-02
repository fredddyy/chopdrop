import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";
import { generateOrderCode } from "@/lib/order-code";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  const payload = await getUserFromCookie();
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, quantity, deliveryAddress } = body;

  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ success: false, error: "productId and quantity required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const unitPrice = product.retailPrice;
  const totalAmount = unitPrice * quantity;
  const serviceFee = 15000; // ₦150 flat
  const deliveryFee = deliveryAddress ? 120000 : 0; // ₦1,200 for delivery, free for pickup
  const grandTotal = totalAmount + serviceFee + deliveryFee;

  const orderCode = generateOrderCode();
  const paymentRef = `instant_${orderCode}_${Date.now()}`;

  const order = await prisma.instantOrder.create({
    data: {
      orderCode,
      productId,
      userId: payload.id,
      quantity,
      unitPrice,
      totalAmount: grandTotal,
      deliveryAddress: deliveryAddress || null,
      deliveryFee,
      serviceFee,
      paymentRef,
    },
  });

  try {
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const callbackUrl = `${origin}/order/instant/${order.orderCode}`;

    const paystackRes = await initializeTransaction({
      email: user.email || `${user.phone}@chopdrop.ng`,
      amount: grandTotal,
      reference: paymentRef,
      callbackUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderCode: order.orderCode,
        totalAmount: grandTotal,
        authorizationUrl: paystackRes.data.authorization_url,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 500 });
  }
}
