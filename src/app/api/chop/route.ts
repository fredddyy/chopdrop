import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { nanoid } from "nanoid";

interface ChopItem {
  productId: string;
  quantity: number;
  retailPrice: number;
  groupPrice: number;
  name: string;
  imageUrl: string | null;
}

// POST /api/chop — create a Price Chop session
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token)
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  const user = verifyToken(token);
  if (!user)
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 },
    );

  const body = await request.json();
  const { items } = body as { items: ChopItem[] };

  if (!items || items.length === 0) {
    return NextResponse.json(
      { success: false, error: "No items" },
      { status: 400 },
    );
  }

  // Verify all products exist
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product not found: ${item.productId}` },
        { status: 404 },
      );
    }
  }

  // Calculate totals (all values in kobo)
  const retailTotal = items.reduce(
    (sum, i) => sum + i.retailPrice * i.quantity,
    0,
  );
  const groupFloor = items.reduce(
    (sum, i) => sum + i.groupPrice * i.quantity,
    0,
  );

  const savingsRange = retailTotal - groupFloor;

  // Determine chop amount per click
  // Default ₦100 (10000 kobo), but if total savings < ₦500 use smaller chops
  // to ensure at least 5 chops are possible
  let chopAmountPerClick = 10000;
  if (savingsRange < 50000) {
    chopAmountPerClick = Math.floor(savingsRange / 5);
  }

  const maxChops = Math.min(
    Math.floor(savingsRange / chopAmountPerClick),
    50,
  );

  if (maxChops <= 0) {
    return NextResponse.json(
      { success: false, error: "Items not eligible for Price Chop" },
      { status: 400 },
    );
  }

  const shareCode = nanoid(8).toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const serviceFee = 15000; // ₦150
  const currentTotal = retailTotal;

  const session = await prisma.chopSession.create({
    data: {
      userId: user.id,
      shareCode,
      cartSnapshot: JSON.parse(JSON.stringify(items)),
      retailTotal,
      groupFloor,
      chopAmountPerClick,
      maxChops,
      currentTotal,
      serviceFee,
      expiresAt,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      shareCode: session.shareCode,
      retailTotal,
      groupFloor,
      currentTotal,
      chopAmountPerClick,
      maxChops,
      expiresAt,
      serviceFee,
    },
  });
}
