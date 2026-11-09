import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";

// GET /api/group-orders/:id/verify?reference=go_xxx
// Verifies payment with Paystack and updates the member's payment status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const reference = request.nextUrl.searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ success: false, error: "Reference required" }, { status: 400 });
  }

  const member = await prisma.groupOrderMember.findFirst({
    where: { groupOrderId: id, paymentRef: reference },
  });

  if (!member) {
    return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
  }

  // Already confirmed
  if (member.paymentStatus === "SUCCESS") {
    return NextResponse.json({ success: true, data: { paymentStatus: "SUCCESS" } });
  }

  // Verify with Paystack
  const verification = await verifyTransaction(reference);

  if (verification.data.status === "success") {
    const expectedAmount = member.subtotal + member.deliveryShare;
    if (verification.data.amount !== expectedAmount) {
      return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
    }

    await prisma.groupOrderMember.update({
      where: { id: member.id },
      data: { paymentStatus: "SUCCESS", paidAt: new Date(verification.data.paid_at) },
    });

    return NextResponse.json({ success: true, data: { paymentStatus: "SUCCESS" } });
  }

  return NextResponse.json({
    success: true,
    data: { paymentStatus: member.paymentStatus },
  });
}
