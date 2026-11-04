import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { initializeTransaction } from "@/lib/paystack";

// POST /api/pools/:id/checkout — initiate Paystack payment for a pool member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: poolId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  // Find the user's membership in this pool
  const member = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId: user.id } },
    include: {
      pool: { select: { status: true, deadline: true, productId: true, product: { select: { name: true } } } },
    },
  });

  if (!member) return NextResponse.json({ success: false, error: "You're not in this pool" }, { status: 404 });
  if (member.paymentStatus === "SUCCESS") return NextResponse.json({ success: false, error: "Already paid" }, { status: 400 });
  if (member.pool.status === "EXPIRED" || member.pool.status === "CANCELLED") {
    return NextResponse.json({ success: false, error: "Pool is no longer active" }, { status: 400 });
  }

  // Total = product cost + delivery fee
  const totalAmount = member.totalAmount + member.deliveryFee;

  // Generate unique payment reference
  const reference = `pool_${poolId.slice(0, 8)}_${user.id.slice(0, 8)}_${Date.now()}`;

  // Get user email for Paystack (fallback to phone@chopdrop.ng)
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, phone: true } });
  const email = dbUser?.email || `${dbUser?.phone || "user"}@chopdrop.ng`;

  const origin = request.headers.get("origin") || "https://chopdrop-app.vercel.app";
  const callbackUrl = `${origin}/pools?paid=${poolId}`;

  const paystack = await initializeTransaction({
    email,
    amount: totalAmount,
    reference,
    callbackUrl,
  });

  // Save payment reference on the member
  await prisma.poolMember.update({
    where: { id: member.id },
    data: { paymentRef: reference },
  });

  return NextResponse.json({
    success: true,
    data: {
      authorizationUrl: paystack.data.authorization_url,
      reference,
      amount: totalAmount,
      productName: member.pool.product.name,
    },
  });
}
