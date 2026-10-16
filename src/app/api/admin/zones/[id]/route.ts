import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const zone = await prisma.zone.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.areas !== undefined && { areas: body.areas.trim() }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json({ success: true, data: zone });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const zone = await prisma.zone.findUnique({
    where: { id },
    include: {
      restaurants: { orderBy: { name: "asc" }, include: { _count: { select: { meals: true } } } },
      offices: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { orders: true, users: true } },
        },
      },
    },
  });

  if (!zone) {
    return NextResponse.json({ success: false, error: "Zone not found" }, { status: 404 });
  }

  // Get order stats for this zone
  const officeIds = zone.offices.map((o) => o.id);
  const orders = officeIds.length > 0
    ? await prisma.order.aggregate({
        where: { officeId: { in: officeIds }, paymentStatus: "SUCCESS" },
        _sum: { totalAmount: true, captainTip: true, serviceFee: true },
        _count: true,
      })
    : { _sum: { totalAmount: 0, captainTip: 0, serviceFee: 0 }, _count: 0 };

  return NextResponse.json({
    success: true,
    data: {
      zone,
      stats: {
        totalRestaurants: zone.restaurants.length,
        totalOffices: zone.offices.length,
        totalOrders: orders._count,
        totalRevenue: orders._sum.totalAmount || 0,
        totalTips: orders._sum.captainTip || 0,
        totalFees: orders._sum.serviceFee || 0,
      },
    },
  });
}
