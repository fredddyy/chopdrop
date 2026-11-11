import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { initializeTransaction } from "@/lib/paystack";

// POST /api/group-orders/:id/checkout — initiate Paystack payment for a group order member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const member = await prisma.groupOrderMember.findUnique({
    where: { groupOrderId_userId: { groupOrderId: id, userId: user.id } },
    include: {
      groupOrder: {
        select: {
          inviteCode: true,
          deliveryFee: true,
          restaurantId: true,
          restaurant: { select: { name: true } },
          members: { select: { id: true, fulfillmentType: true } },
        },
      },
    },
  });

  if (!member) return NextResponse.json({ success: false, error: "You're not in this group order" }, { status: 404 });
  if (member.paymentStatus === "SUCCESS") return NextResponse.json({ success: false, error: "Already paid" }, { status: 400 });
  if (member.subtotal <= 0) return NextResponse.json({ success: false, error: "Add items before checkout" }, { status: 400 });

  // Calculate delivery share: only delivery-requesting members pay
  const deliveryMembers = member.groupOrder.members.filter((m: { fulfillmentType: string }) => m.fulfillmentType === "DELIVERY");
  const isDeliveryMember = member.fulfillmentType === "DELIVERY";
  const deliveryShare = isDeliveryMember && deliveryMembers.length > 0
    ? Math.round(member.groupOrder.deliveryFee / deliveryMembers.length)
    : 0;
  const total = member.subtotal + deliveryShare;

  // Generate unique payment reference
  const reference = `go_${id.slice(0, 8)}_${user.id.slice(0, 8)}_${Date.now()}`;

  // Get user email for Paystack
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, phone: true } });
  const email = dbUser?.email || `${dbUser?.phone || "user"}@chopdrop.ng`;

  const origin = request.headers.get("origin") || "https://chopdrop-app.vercel.app";
  const callbackUrl = `${origin}/group/${member.groupOrder.inviteCode}?reference=${reference}`;

  const paystack = await initializeTransaction({
    email,
    amount: total,
    reference,
    callbackUrl,
  });

  // Save payment reference and delivery share on the member
  await prisma.groupOrderMember.update({
    where: { id: member.id },
    data: { paymentRef: reference, deliveryShare },
  });

  return NextResponse.json({
    success: true,
    data: {
      authorizationUrl: paystack.data.authorization_url,
      reference,
      subtotal: member.subtotal,
      deliveryShare,
      total,
      restaurantName: member.groupOrder.restaurant.name,
    },
  });
}
