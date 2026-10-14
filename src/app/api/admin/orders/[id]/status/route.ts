import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusSchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateOrderStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid status" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ success: true, data: updated });
}
