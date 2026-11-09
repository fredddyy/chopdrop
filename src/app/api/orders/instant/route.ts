import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { initializeTransaction } from "@/lib/paystack";
import { calculateDeliveryFee, DEFAULT_TIERS } from "@/lib/delivery-fee";
import type { DeliveryTier } from "@/lib/delivery-fee";

// POST /api/orders/instant — solo order for a product (not pool)
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { items, deliveryOption, lat, lng } = body as {
    items: Array<{ productId: string; quantity: number; price: number }>;
    deliveryOption?: "pickup" | "delivery";
    lat?: number;
    lng?: number;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ success: false, error: "No items" }, { status: 400 });
  }

  // Calculate totals
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const serviceFee = 15000; // ₦150

  // Use the first item's product for the order
  const primaryProductId = items[0].productId.replace("instant-", "");

  // Verify product exists (check Product table, then Meal table)
  let productName = "Order";
  const product = await prisma.product.findUnique({
    where: { id: primaryProductId },
    select: { name: true, vendorId: true },
  });
  if (product) {
    productName = product.name;
  } else {
    const meal = await prisma.meal.findUnique({ where: { id: primaryProductId }, select: { name: true } });
    if (meal) productName = meal.name;
  }

  // Calculate delivery fee
  let deliveryFee = 0;
  if (deliveryOption === "delivery" && lat && lng && product) {
    const vendor = await prisma.restaurant.findUnique({
      where: { id: product.vendorId },
      select: { latitude: true, longitude: true },
    });
    if (vendor?.latitude && vendor?.longitude) {
      let tiers: DeliveryTier[] = DEFAULT_TIERS;
      try {
        const setting = await prisma.setting.findUnique({ where: { key: "delivery-fee-tiers" } });
        if (setting?.value && Array.isArray(setting.value)) tiers = setting.value as unknown as DeliveryTier[];
      } catch { /* use defaults */ }
      deliveryFee = calculateDeliveryFee(vendor.latitude, vendor.longitude, lat, lng, tiers).fee;
    }
  }

  // Generate order code
  const orderCode = `CD-${Date.now().toString(36).toUpperCase()}`;
  const reference = `solo_${user.id.slice(0, 8)}_${Date.now()}`;

  // Get user email
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, phone: true } });
  const email = dbUser?.email || `${dbUser?.phone || "user"}@chopdrop.ng`;

  const origin = request.headers.get("origin") || "https://chopdrop-app.vercel.app";
  const callbackUrl = `${origin}/orders`;

  // Initialize Paystack
  const paystack = await initializeTransaction({
    email,
    amount: totalAmount + serviceFee + deliveryFee,
    reference,
    callbackUrl,
  });

  if (!paystack?.data?.authorization_url) {
    return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 500 });
  }

  // Create InstantOrder record
  await prisma.instantOrder.create({
    data: {
      orderCode,
      productId: primaryProductId,
      userId: user.id,
      quantity: items.reduce((sum, i) => sum + i.quantity, 0),
      unitPrice: items[0].price,
      totalAmount,
      deliveryFee,
      serviceFee,
      paymentRef: reference,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      orderCode,
      authorizationUrl: paystack.data.authorization_url,
      reference,
      amount: totalAmount + serviceFee + deliveryFee,
      deliveryFee,
      productName,
    },
  });
}
