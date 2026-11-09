import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// GET /api/group-orders/:id — full group order detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id },
    include: {
      restaurant: { select: { id: true, name: true, imageUrl: true } },
      coordinator: { select: { id: true, firstName: true } },
      members: {
        include: {
          user: { select: { id: true, firstName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!groupOrder) return NextResponse.json({ success: false, error: "Group order not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      id: groupOrder.id,
      inviteCode: groupOrder.inviteCode,
      status: groupOrder.status,
      deadline: groupOrder.deadline,
      deliveryAddress: groupOrder.deliveryAddress,
      deliveryFee: groupOrder.deliveryFee,
      createdAt: groupOrder.createdAt,
      restaurant: groupOrder.restaurant,
      coordinator: groupOrder.coordinator,
      members: groupOrder.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        firstName: m.user.firstName,
        items: m.items,
        subtotal: m.subtotal,
        deliveryShare: m.deliveryShare,
        paymentStatus: m.paymentStatus,
      })),
    },
  });
}
