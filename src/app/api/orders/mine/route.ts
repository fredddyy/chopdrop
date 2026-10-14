import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

export async function GET(request: NextRequest) {
  // Try authenticated user first
  const userPayload = await getUserFromCookie();

  // Fallback to phone query param
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!userPayload && !phone) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const where: Record<string, unknown> = { paymentStatus: "SUCCESS" };

  if (userPayload) {
    where.userId = userPayload.id;
  } else if (phone) {
    where.customerPhone = phone;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      dailyMenu: {
        include: {
          meal: { include: { restaurant: true } },
          timeSlot: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ success: true, data: orders });
}
