import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

// PATCH /api/group-orders/:id/items — update items for the authenticated member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("chopdrop-user-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { items } = body as { items: OrderItem[] };

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ success: false, error: "items array required" }, { status: 400 });
  }

  const member = await prisma.groupOrderMember.findUnique({
    where: { groupOrderId_userId: { groupOrderId: id, userId: user.id } },
  });

  if (!member) return NextResponse.json({ success: false, error: "You're not in this group order" }, { status: 404 });

  // Calculate subtotal from items (price is in kobo)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updated = await prisma.groupOrderMember.update({
    where: { id: member.id },
    data: {
      items: JSON.parse(JSON.stringify(items)),
      subtotal,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      items: updated.items,
      subtotal: updated.subtotal,
    },
  });
}
