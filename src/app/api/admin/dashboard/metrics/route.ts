import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  // Yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Week boundaries
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6); // last 7 days
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  // ── TODAY'S ORDERS ──
  const todayOrders = await prisma.order.findMany({
    where: { createdAt: { gte: today }, paymentStatus: "SUCCESS" },
    select: { id: true, totalAmount: true, serviceFee: true, officeId: true, userId: true, quantity: true },
  });

  const yesterdayOrders = await prisma.order.findMany({
    where: { createdAt: { gte: yesterday, lt: today }, paymentStatus: "SUCCESS" },
    select: { id: true, totalAmount: true, serviceFee: true, officeId: true, userId: true },
  });

  // ── FAILED PAYMENTS TODAY ──
  const failedToday = await prisma.order.count({
    where: { createdAt: { gte: today }, paymentStatus: { in: ["FAILED"] } },
  });
  const pendingToday = await prisma.order.count({
    where: { createdAt: { gte: today }, paymentStatus: "PENDING" },
  });

  // ── ACTIVE OFFICES TODAY ──
  const todayOfficeIds = new Set(todayOrders.filter(o => o.officeId).map(o => o.officeId!));
  const yesterdayOfficeIds = new Set(yesterdayOrders.filter(o => o.officeId).map(o => o.officeId!));
  const totalOffices = await prisma.office.count({ where: { isActive: true } });

  // ── AVERAGE POOL SIZE ──
  const poolSizes = Array.from(todayOfficeIds).map(officeId =>
    todayOrders.filter(o => o.officeId === officeId).length
  );
  const avgPoolSize = poolSizes.length > 0
    ? poolSizes.reduce((a, b) => a + b, 0) / poolSizes.length
    : 0;

  // ── REPEAT RATE (yesterday's users who ordered today) ──
  const yesterdayUserIds = new Set(yesterdayOrders.filter(o => o.userId).map(o => o.userId!));
  const todayUserIds = new Set(todayOrders.filter(o => o.userId).map(o => o.userId!));
  const repeatUsers = [...todayUserIds].filter(id => yesterdayUserIds.has(id)).length;
  const repeatRate = yesterdayUserIds.size > 0
    ? Math.round((repeatUsers / yesterdayUserIds.size) * 100)
    : 0;

  // ── REVENUE ──
  const todayRevenue = todayOrders.reduce((s, o) => s + o.serviceFee, 0);
  const todayDiscountCost = 0; // TODO: calculate from pool credits issued today
  const todayGross = todayOrders.reduce((s, o) => s + o.totalAmount, 0);

  // ── WEEKLY STATS ──
  const weekOrders = await prisma.order.count({
    where: { createdAt: { gte: weekStart }, paymentStatus: "SUCCESS" },
  });
  const prevWeekOrders = await prisma.order.count({
    where: { createdAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" },
  });

  const newUsersWeek = await prisma.user.count({
    where: { createdAt: { gte: weekStart } },
  });
  const newOfficesWeek = await prisma.office.count({
    where: { createdAt: { gte: weekStart } },
  });

  // ── CREDIT LIABILITY ──
  const creditWallets = await prisma.creditWallet.aggregate({
    _sum: { balance: true },
  });

  // ── POOL SIZE PER OFFICE (for breakdown) ──
  const officePoolBreakdown = await Promise.all(
    Array.from(todayOfficeIds).map(async (officeId) => {
      const office = await prisma.office.findUnique({ where: { id: officeId }, select: { name: true } });
      const count = todayOrders.filter(o => o.officeId === officeId).length;
      return { name: office?.name || "Unknown", orders: count };
    })
  );
  officePoolBreakdown.sort((a, b) => b.orders - a.orders);

  return NextResponse.json({
    success: true,
    data: {
      today: {
        orders: todayOrders.length,
        ordersYesterday: yesterdayOrders.length,
        ordersDelta: todayOrders.length - yesterdayOrders.length,
        grossRevenue: todayGross,
        serviceChargeRevenue: todayRevenue,
        discountCost: todayDiscountCost,
        netMargin: todayRevenue - todayDiscountCost,
        activeOffices: todayOfficeIds.size,
        totalOffices,
        activeOfficesYesterday: yesterdayOfficeIds.size,
        avgPoolSize: Math.round(avgPoolSize * 10) / 10,
        repeatRate,
        repeatUsers,
        totalUsersYesterday: yesterdayUserIds.size,
        failedPayments: failedToday,
        pendingPayments: pendingToday,
      },
      week: {
        orders: weekOrders,
        prevWeekOrders,
        ordersDelta: weekOrders - prevWeekOrders,
        newUsers: newUsersWeek,
        newOffices: newOfficesWeek,
      },
      creditLiability: creditWallets._sum.balance || 0,
      officeBreakdown: officePoolBreakdown,
    },
  });
}
