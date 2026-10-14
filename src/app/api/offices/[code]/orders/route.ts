import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const office = await prisma.office.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!office) {
    return NextResponse.json(
      { success: false, error: "Office not found" },
      { status: 404 }
    );
  }

  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      officeId: office.id,
      paymentStatus: "SUCCESS",
      createdAt: { gte: today, lte: endOfDay },
    },
    include: {
      dailyMenu: {
        include: {
          meal: { include: { restaurant: true } },
          timeSlot: true,
        },
      },
      items: { include: { menuItem: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: {
      office: {
        id: office.id,
        name: office.name,
        code: office.code,
        address: office.address,
        collectionPoint: office.collectionPoint,
        assistantName: office.assistantName,
      },
      orders,
    },
  });
}
