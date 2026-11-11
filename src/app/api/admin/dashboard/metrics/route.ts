import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Week boundaries
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  // 30-day boundary for trends
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ═══════════════════════════════════════
  // Fetch all order channels in parallel
  // ═══════════════════════════════════════

  const [
    // Legacy orders (today + yesterday + week)
    todayOrders,
    yesterdayOrders,
    weekLegacyOrders,
    prevWeekLegacyOrders,

    // Group orders (today + yesterday + week)
    todayGroupMembers,
    yesterdayGroupMembers,
    weekGroupMembers,
    prevWeekGroupMembers,

    // Pool members (today + yesterday + week)
    todayPoolMembers,
    yesterdayPoolMembers,
    weekPoolMembers,
    prevWeekPoolMembers,

    // Instant orders (today + yesterday + week)
    todayInstantOrders,
    yesterdayInstantOrders,
    weekInstantOrders,
    prevWeekInstantOrders,

    // User growth
    totalUsers,
    newUsersThisWeek,
    newUsersPrevWeek,

    // Gangs
    totalGangs,
    activeGangs,

    // Credit liability
    creditAgg,

    // Restaurant list
    restaurants,

    // Group orders with restaurant info (this week)
    weekGroupOrdersFull,
    prevWeekGroupOrdersFull,

    // Failed/pending today
    failedToday,
    pendingToday,
  ] = await Promise.all([
    // Legacy orders
    prisma.order.findMany({
      where: { createdAt: { gte: today }, paymentStatus: "SUCCESS" },
      select: { id: true, totalAmount: true, serviceFee: true, userId: true, officeId: true, quantity: true, dailyMenu: { select: { meal: { select: { restaurantId: true } } } } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: yesterday, lt: today }, paymentStatus: "SUCCESS" },
      select: { id: true, totalAmount: true, userId: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: weekStart }, paymentStatus: "SUCCESS" } }),
    prisma.order.count({ where: { createdAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" } }),

    // Group order members (paid)
    prisma.groupOrderMember.findMany({
      where: { paidAt: { gte: today }, paymentStatus: "SUCCESS" },
      select: { id: true, subtotal: true, deliveryShare: true, userId: true, groupOrder: { select: { restaurantId: true } } },
    }),
    prisma.groupOrderMember.findMany({
      where: { paidAt: { gte: yesterday, lt: today }, paymentStatus: "SUCCESS" },
      select: { id: true, userId: true },
    }),
    prisma.groupOrderMember.count({ where: { paidAt: { gte: weekStart }, paymentStatus: "SUCCESS" } }),
    prisma.groupOrderMember.count({ where: { paidAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" } }),

    // Pool members (paid)
    prisma.poolMember.findMany({
      where: { paidAt: { gte: today }, paymentStatus: "SUCCESS" },
      select: { id: true, totalAmount: true, deliveryFee: true, userId: true, pool: { select: { product: { select: { vendorId: true } } } } },
    }),
    prisma.poolMember.findMany({
      where: { paidAt: { gte: yesterday, lt: today }, paymentStatus: "SUCCESS" },
      select: { id: true, userId: true },
    }),
    prisma.poolMember.count({ where: { paidAt: { gte: weekStart }, paymentStatus: "SUCCESS" } }),
    prisma.poolMember.count({ where: { paidAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" } }),

    // Instant orders (paid)
    prisma.instantOrder.findMany({
      where: { paidAt: { gte: today }, paymentStatus: "SUCCESS" },
      select: { id: true, totalAmount: true, deliveryFee: true, serviceFee: true, userId: true, product: { select: { vendorId: true } } },
    }),
    prisma.instantOrder.findMany({
      where: { paidAt: { gte: yesterday, lt: today }, paymentStatus: "SUCCESS" },
      select: { id: true, userId: true },
    }),
    prisma.instantOrder.count({ where: { paidAt: { gte: weekStart }, paymentStatus: "SUCCESS" } }),
    prisma.instantOrder.count({ where: { paidAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" } }),

    // Users
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: prevWeekStart, lt: weekStart } } }),

    // Gangs
    prisma.gang.count(),
    prisma.gang.count({
      where: { groupOrders: { some: { createdAt: { gte: weekStart } } } },
    }),

    // Credits
    prisma.creditWallet.aggregate({ _sum: { balance: true } }),

    // Restaurants
    prisma.restaurant.findMany({
      where: { isActive: true },
      select: { id: true, name: true, imageUrl: true },
    }),

    // Full group orders this week (for avg group size)
    prisma.groupOrder.findMany({
      where: { createdAt: { gte: weekStart } },
      select: {
        id: true,
        restaurantId: true,
        _count: { select: { members: true } },
        members: { where: { paymentStatus: "SUCCESS" }, select: { id: true } },
      },
    }),
    prisma.groupOrder.findMany({
      where: { createdAt: { gte: prevWeekStart, lt: weekStart } },
      select: {
        id: true,
        _count: { select: { members: true } },
        members: { where: { paymentStatus: "SUCCESS" }, select: { id: true } },
      },
    }),

    // Failed/pending
    prisma.order.count({ where: { createdAt: { gte: today }, paymentStatus: "FAILED" } }),
    prisma.order.count({ where: { createdAt: { gte: today }, paymentStatus: "PENDING" } }),
  ]);

  // ═══════════════════════════════════════
  // Aggregate totals
  // ═══════════════════════════════════════

  // Today totals (across all channels)
  const todayOrderCount = todayOrders.length + todayGroupMembers.length + todayPoolMembers.length + todayInstantOrders.length;
  const yesterdayOrderCount = yesterdayOrders.length + yesterdayGroupMembers.length + yesterdayPoolMembers.length + yesterdayInstantOrders.length;

  const todayGrossRevenue =
    todayOrders.reduce((s, o) => s + o.totalAmount, 0) +
    todayGroupMembers.reduce((s, m) => s + m.subtotal + m.deliveryShare, 0) +
    todayPoolMembers.reduce((s, m) => s + m.totalAmount + m.deliveryFee, 0) +
    todayInstantOrders.reduce((s, o) => s + o.totalAmount, 0);

  // Week totals
  const weekOrderCount = weekLegacyOrders + weekGroupMembers + weekPoolMembers + weekInstantOrders;
  const prevWeekOrderCount = prevWeekLegacyOrders + prevWeekGroupMembers + prevWeekPoolMembers + prevWeekInstantOrders;

  // Repeat rate: yesterday's users who also ordered today (across all channels)
  const yesterdayUserIds = new Set([
    ...yesterdayOrders.filter(o => o.userId).map(o => o.userId!),
    ...yesterdayGroupMembers.map(m => m.userId),
    ...yesterdayPoolMembers.map(m => m.userId),
    ...yesterdayInstantOrders.map(o => o.userId),
  ]);
  const todayUserIds = new Set([
    ...todayOrders.filter(o => o.userId).map(o => o.userId!),
    ...todayGroupMembers.map(m => m.userId),
    ...todayPoolMembers.map(m => m.userId),
    ...todayInstantOrders.map(o => o.userId),
  ]);
  const repeatUsers = Array.from(todayUserIds).filter(id => yesterdayUserIds.has(id)).length;
  const repeatRate = yesterdayUserIds.size > 0
    ? Math.round((repeatUsers / yesterdayUserIds.size) * 100)
    : 0;

  // Average group size (from group orders this week)
  const groupSizes = weekGroupOrdersFull
    .map(go => go.members.length)
    .filter(s => s > 0);
  const avgGroupSize = groupSizes.length > 0
    ? Math.round((groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length) * 10) / 10
    : 0;

  const prevGroupSizes = prevWeekGroupOrdersFull
    .map(go => go.members.length)
    .filter(s => s > 0);
  const prevAvgGroupSize = prevGroupSizes.length > 0
    ? Math.round((prevGroupSizes.reduce((a, b) => a + b, 0) / prevGroupSizes.length) * 10) / 10
    : 0;

  // ═══════════════════════════════════════
  // Restaurant breakdown
  // ═══════════════════════════════════════

  const restaurantMap = new Map<string, {
    id: string;
    name: string;
    imageUrl: string | null;
    weekOrders: number;
    prevWeekOrders: number;
    weekRevenue: number;
    uniqueCustomers: Set<string>;
    groupOrders: number;
  }>();

  for (const r of restaurants) {
    restaurantMap.set(r.id, {
      id: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
      weekOrders: 0,
      prevWeekOrders: 0,
      weekRevenue: 0,
      uniqueCustomers: new Set(),
      groupOrders: 0,
    });
  }

  // Count legacy orders by restaurant (today only, but we'll query week for breakdown)
  for (const o of todayOrders) {
    const rid = o.dailyMenu.meal.restaurantId;
    const entry = restaurantMap.get(rid);
    if (entry) {
      entry.weekOrders += 1;
      entry.weekRevenue += o.totalAmount;
      if (o.userId) entry.uniqueCustomers.add(o.userId);
    }
  }

  // Count group order members by restaurant (today)
  for (const m of todayGroupMembers) {
    const rid = m.groupOrder.restaurantId;
    const entry = restaurantMap.get(rid);
    if (entry) {
      entry.weekOrders += 1;
      entry.weekRevenue += m.subtotal + m.deliveryShare;
      entry.uniqueCustomers.add(m.userId);
    }
  }

  // Count pool members by restaurant (today)
  for (const m of todayPoolMembers) {
    const rid = m.pool.product.vendorId;
    const entry = restaurantMap.get(rid);
    if (entry) {
      entry.weekOrders += 1;
      entry.weekRevenue += m.totalAmount + m.deliveryFee;
      entry.uniqueCustomers.add(m.userId);
    }
  }

  // Count instant orders by restaurant (today)
  for (const o of todayInstantOrders) {
    const rid = o.product.vendorId;
    const entry = restaurantMap.get(rid);
    if (entry) {
      entry.weekOrders += 1;
      entry.weekRevenue += o.totalAmount;
      entry.uniqueCustomers.add(o.userId);
    }
  }

  // Count group orders per restaurant this week
  for (const go of weekGroupOrdersFull) {
    const entry = restaurantMap.get(go.restaurantId);
    if (entry && go.members.length > 0) {
      entry.groupOrders += 1;
    }
  }

  // Now do a broader query for full week restaurant breakdown
  // We'll do this with the weekly group members and pool members
  const weekGroupMembersFull = await prisma.groupOrderMember.findMany({
    where: { paidAt: { gte: weekStart }, paymentStatus: "SUCCESS" },
    select: { subtotal: true, deliveryShare: true, userId: true, groupOrder: { select: { restaurantId: true } } },
  });
  const weekPoolMembersFull = await prisma.poolMember.findMany({
    where: { paidAt: { gte: weekStart }, paymentStatus: "SUCCESS" },
    select: { totalAmount: true, deliveryFee: true, userId: true, pool: { select: { product: { select: { vendorId: true } } } } },
  });
  const weekInstantOrdersFull = await prisma.instantOrder.findMany({
    where: { paidAt: { gte: weekStart }, paymentStatus: "SUCCESS" },
    select: { totalAmount: true, userId: true, product: { select: { vendorId: true } } },
  });
  const weekLegacyOrdersFull = await prisma.order.findMany({
    where: { createdAt: { gte: weekStart }, paymentStatus: "SUCCESS" },
    select: { totalAmount: true, userId: true, quantity: true, dailyMenu: { select: { meal: { select: { restaurantId: true } } } } },
  });

  // Reset and rebuild with full week data
  for (const entry of Array.from(restaurantMap.values())) {
    entry.weekOrders = 0;
    entry.weekRevenue = 0;
    entry.uniqueCustomers = new Set();
  }

  for (const o of weekLegacyOrdersFull) {
    const rid = o.dailyMenu.meal.restaurantId;
    const entry = restaurantMap.get(rid);
    if (entry) {
      entry.weekOrders += o.quantity;
      entry.weekRevenue += o.totalAmount;
      if (o.userId) entry.uniqueCustomers.add(o.userId);
    }
  }
  for (const m of weekGroupMembersFull) {
    const rid = m.groupOrder.restaurantId;
    const entry = restaurantMap.get(rid);
    if (entry) {
      entry.weekOrders += 1;
      entry.weekRevenue += m.subtotal + m.deliveryShare;
      entry.uniqueCustomers.add(m.userId);
    }
  }
  for (const m of weekPoolMembersFull) {
    const rid = m.pool.product.vendorId;
    const entry = restaurantMap.get(rid);
    if (entry) {
      entry.weekOrders += 1;
      entry.weekRevenue += m.totalAmount + m.deliveryFee;
      entry.uniqueCustomers.add(m.userId);
    }
  }
  for (const o of weekInstantOrdersFull) {
    const rid = o.product.vendorId;
    const entry = restaurantMap.get(rid);
    if (entry) {
      entry.weekOrders += 1;
      entry.weekRevenue += o.totalAmount;
      entry.uniqueCustomers.add(o.userId);
    }
  }

  // Previous week per-restaurant counts (for delta)
  const prevWeekLegacyFull = await prisma.order.findMany({
    where: { createdAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" },
    select: { quantity: true, dailyMenu: { select: { meal: { select: { restaurantId: true } } } } },
  });
  const prevWeekGroupFull = await prisma.groupOrderMember.findMany({
    where: { paidAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" },
    select: { groupOrder: { select: { restaurantId: true } } },
  });
  const prevWeekPoolFull = await prisma.poolMember.findMany({
    where: { paidAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" },
    select: { pool: { select: { product: { select: { vendorId: true } } } } },
  });
  const prevWeekInstantFull = await prisma.instantOrder.findMany({
    where: { paidAt: { gte: prevWeekStart, lt: weekStart }, paymentStatus: "SUCCESS" },
    select: { product: { select: { vendorId: true } } },
  });

  const prevWeekByRestaurant = new Map<string, number>();
  for (const o of prevWeekLegacyFull) {
    const rid = o.dailyMenu.meal.restaurantId;
    prevWeekByRestaurant.set(rid, (prevWeekByRestaurant.get(rid) || 0) + o.quantity);
  }
  for (const m of prevWeekGroupFull) {
    const rid = m.groupOrder.restaurantId;
    prevWeekByRestaurant.set(rid, (prevWeekByRestaurant.get(rid) || 0) + 1);
  }
  for (const m of prevWeekPoolFull) {
    const rid = m.pool.product.vendorId;
    prevWeekByRestaurant.set(rid, (prevWeekByRestaurant.get(rid) || 0) + 1);
  }
  for (const o of prevWeekInstantFull) {
    const rid = o.product.vendorId;
    prevWeekByRestaurant.set(rid, (prevWeekByRestaurant.get(rid) || 0) + 1);
  }

  for (const entry of Array.from(restaurantMap.values())) {
    entry.prevWeekOrders = prevWeekByRestaurant.get(entry.id) || 0;
  }

  // Build sorted breakdown
  const restaurantBreakdown = Array.from(restaurantMap.values())
    .map(r => ({
      id: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
      weekOrders: r.weekOrders,
      prevWeekOrders: r.prevWeekOrders,
      ordersDelta: r.weekOrders - r.prevWeekOrders,
      weekRevenue: r.weekRevenue,
      uniqueCustomers: r.uniqueCustomers.size,
      groupOrders: r.groupOrders,
    }))
    .sort((a, b) => b.weekOrders - a.weekOrders);

  // ═══════════════════════════════════════
  // Active pools / flash deals
  // ═══════════════════════════════════════

  const activePools = await prisma.pool.count({
    where: { status: "OPEN", deadline: { gt: now } },
  });
  const activeFlashDeals = await prisma.pool.count({
    where: { status: "OPEN", isFlashDeal: true, deadline: { gt: now } },
  });

  // ═══════════════════════════════════════
  // Channel breakdown (this week)
  // ═══════════════════════════════════════

  const channelBreakdown = {
    legacy: weekLegacyOrders,
    groupOrders: weekGroupMembers,
    pools: weekPoolMembers,
    instant: weekInstantOrders,
  };

  return NextResponse.json({
    success: true,
    data: {
      today: {
        orders: todayOrderCount,
        ordersYesterday: yesterdayOrderCount,
        ordersDelta: todayOrderCount - yesterdayOrderCount,
        grossRevenue: todayGrossRevenue,
        serviceChargeRevenue: todayOrders.reduce((s, o) => s + o.serviceFee, 0),
        discountCost: 0,
        netMargin: todayOrders.reduce((s, o) => s + o.serviceFee, 0),
        activeOffices: new Set(todayOrders.filter(o => o.officeId).map(o => o.officeId!)).size,
        totalOffices: await prisma.office.count({ where: { isActive: true } }),
        activeOfficesYesterday: 0,
        avgPoolSize: 0,
        repeatRate,
        repeatUsers,
        totalUsersYesterday: yesterdayUserIds.size,
        failedPayments: failedToday,
        pendingPayments: pendingToday,
      },
      week: {
        orders: weekOrderCount,
        prevWeekOrders: prevWeekOrderCount,
        ordersDelta: weekOrderCount - prevWeekOrderCount,
        newUsers: newUsersThisWeek,
        prevWeekNewUsers: newUsersPrevWeek,
        newOffices: 0,
      },
      platform: {
        totalUsers,
        totalGangs,
        activeGangs,
        activePools,
        activeFlashDeals,
        avgGroupSize,
        prevAvgGroupSize,
      },
      creditLiability: creditAgg._sum.balance || 0,
      channelBreakdown,
      restaurantBreakdown,
    },
  });
}
