import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validators";
import { generateOrderCode } from "@/lib/order-code";
import { initializeTransaction } from "@/lib/paystack";
import { isSlotExpired } from "@/lib/utils";
import { getUserFromCookie } from "@/lib/user-auth";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const ip = getRateLimitKey(request);
  const limit = rateLimit(`order:${ip}`, 20, 60000);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: "Too many orders. Try again in a minute." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.fulfillmentType === "DELIVERY" && !data.deliveryAddress) {
    return NextResponse.json(
      { success: false, error: "Delivery address is required" },
      { status: 400 }
    );
  }

  const dailyMenu = await prisma.dailyMenu.findUnique({
    where: { id: data.dailyMenuId },
    include: {
      meal: { include: { restaurant: true } },
      timeSlot: true,
    },
  });

  if (!dailyMenu) {
    return NextResponse.json(
      { success: false, error: "Menu item not found" },
      { status: 404 }
    );
  }

  if (isSlotExpired(dailyMenu.timeSlot.cutoffTime)) {
    return NextResponse.json(
      { success: false, error: "Orders for this time slot are closed" },
      { status: 400 }
    );
  }

  if (dailyMenu.currentOrders + data.quantity > dailyMenu.maxOrders) {
    return NextResponse.json(
      { success: false, error: "Not enough capacity for this order" },
      { status: 400 }
    );
  }

  // Calculate total amount
  // Use client-sent subtotal (sum of all cart items × quantities) when available,
  // fall back to single-meal calculation for backwards compatibility
  let totalAmount: number;
  if (data.subtotal && data.subtotal > 0) {
    totalAmount = data.subtotal;
  } else if (dailyMenu.meal.type === "BUILD_YOUR_PLATE" && data.items?.length) {
    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    totalAmount = data.items.reduce((sum, item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      return sum + (menuItem?.price ?? 0) * item.quantity;
    }, 0) * data.quantity;
  } else {
    totalAmount = dailyMenu.meal.price * data.quantity;
  }

  const orderCode = generateOrderCode();
  const paymentRef = `chopdrop_${nanoid(16)}`;
  const email = data.customerEmail || `${data.customerPhone}@chopdrop.ng`;

  // Get authenticated user if available
  const userPayload = await getUserFromCookie();

  // Validate and apply credits if requested
  const creditsApplied = data.creditsApplied ?? 0;
  if (creditsApplied > 0) {
    if (!userPayload) {
      return NextResponse.json(
        { success: false, error: "Must be logged in to apply credits" },
        { status: 401 }
      );
    }

    const wallet = await prisma.creditWallet.findFirst({
      where: { userId: userPayload.id },
    });

    if (!wallet || wallet.balance < creditsApplied) {
      return NextResponse.json(
        { success: false, error: "Insufficient credits" },
        { status: 400 }
      );
    }
  }

  // Payment amount = meal total + tip + service fee - credits
  const grossPaymentAmount = totalAmount + (data.captainTip || 0) + (data.serviceFee || 0);
  const paymentAmount = Math.max(0, grossPaymentAmount - creditsApplied);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let order: Awaited<ReturnType<typeof prisma.order.create>>;

  if (creditsApplied > 0 && userPayload) {
    // Run credit deduction + order creation in a transaction
    order = await prisma.$transaction(async (tx) => {
      const wallet = await tx.creditWallet.findFirstOrThrow({
        where: { userId: userPayload.id },
      });

      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: creditsApplied } },
      });

      const newOrder = await tx.order.create({
        data: {
          orderCode,
          dailyMenuId: data.dailyMenuId,
          userId: userPayload.id,
          officeId: data.officeId || null,
          dropPointId: data.dropPointId || null,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          fulfillmentType: data.fulfillmentType,
          deliveryAddress: data.deliveryAddress || null,
          quantity: data.quantity,
          totalAmount,
          captainTip: data.captainTip || 0,
          serviceFee: data.serviceFee || 0,
          creditsApplied,
          paymentRef,
          ...(paymentAmount <= 0 ? { paymentStatus: "SUCCESS", paidAt: new Date() } : {}),
          items: data.items?.length
            ? {
                create: data.items.map((item) => ({
                  menuItemId: item.menuItemId,
                  quantity: item.quantity,
                  price:
                    totalAmount /
                    data.quantity /
                    (data.items?.length || 1),
                })),
              }
            : undefined,
        },
      });

      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          orderId: newOrder.id,
          amount: -creditsApplied,
          type: "APPLIED",
          description: `Credits applied to order ${orderCode}`,
        },
      });

      return newOrder;
    });
  } else {
    order = await prisma.order.create({
      data: {
        orderCode,
        dailyMenuId: data.dailyMenuId,
        userId: userPayload?.id || null,
        officeId: data.officeId || null,
        dropPointId: data.dropPointId || null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || null,
        fulfillmentType: data.fulfillmentType,
        deliveryAddress: data.deliveryAddress || null,
        quantity: data.quantity,
        totalAmount,
        captainTip: data.captainTip || 0,
        serviceFee: data.serviceFee || 0,
        paymentRef,
        items: data.items?.length
          ? {
              create: data.items.map((item) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price:
                  totalAmount /
                  data.quantity /
                  (data.items?.length || 1), // will be corrected below
              })),
            }
          : undefined,
      },
    });
  }

  // Fix order item prices with actual values
  if (data.items?.length) {
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: data.items.map((i) => i.menuItemId) } },
    });
    for (const item of data.items) {
      const mi = menuItems.find((m) => m.id === item.menuItemId);
      if (mi) {
        await prisma.orderItem.updateMany({
          where: { orderId: order.id, menuItemId: item.menuItemId },
          data: { price: mi.price },
        });
      }
    }
  }

  // Credits cover the full amount — skip Paystack
  if (paymentAmount <= 0) {
    return NextResponse.json({
      success: true,
      data: {
        orderCode,
        reference: paymentRef,
        authorizationUrl: null,
        totalAmount: grossPaymentAmount,
        creditsApplied,
        paidWithCredits: true,
      },
    });
  }

  const paystack = await initializeTransaction({
    email,
    amount: paymentAmount,
    reference: paymentRef,
    callbackUrl: `${appUrl}/order/confirmation/${orderCode}`,
  });

  return NextResponse.json({
    success: true,
    data: {
      orderCode,
      reference: paymentRef,
      authorizationUrl: paystack.data.authorization_url,
      totalAmount: grossPaymentAmount,
      creditsApplied,
    },
  });
}
