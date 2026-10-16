import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const office = await prisma.office.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
          orders: {
            where: { paymentStatus: "SUCCESS" },
            select: { id: true, totalAmount: true, captainTip: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      orders: {
        where: { paymentStatus: "SUCCESS" },
        select: { id: true, totalAmount: true, captainTip: true, serviceFee: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!office) {
    return NextResponse.json({ success: false, error: "Office not found" }, { status: 404 });
  }

  const totalOrders = office.orders.length;
  const totalRevenue = office.orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalTips = office.orders.reduce((s, o) => s + o.captainTip, 0);
  const totalServiceFees = office.orders.reduce((s, o) => s + o.serviceFee, 0);

  // Today's stats
  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");
  const todayOrders = office.orders.filter((o) => new Date(o.createdAt) >= today);
  const todayTips = todayOrders.reduce((s, o) => s + o.captainTip, 0);

  const members = office.users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    phone: u.phone,
    joinedAt: u.createdAt,
    orderCount: u.orders.length,
    totalSpent: u.orders.reduce((s, o) => s + o.totalAmount, 0),
    lastOrder: u.orders[0]?.createdAt || null,
  }));

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
        assistantPhone: office.assistantPhone,
        assistantEmail: office.assistantEmail,
      },
      stats: {
        totalMembers: members.length,
        totalOrders,
        totalRevenue,
        totalTips,
        totalServiceFees,
        todayOrders: todayOrders.length,
        todayTips,
      },
      members,
    },
  });
}
