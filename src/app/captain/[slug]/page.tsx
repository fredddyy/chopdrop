import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CaptainDashboard } from "@/components/captain-dashboard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function CaptainPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  const office = await prisma.office.findUnique({
    where: { slug },
  });

  if (!office || !office.isActive) {
    notFound();
  }

  // Verify secret token — prevents slug guessing
  if (office.secretToken && office.secretToken !== "" && token !== office.secretToken) {
    notFound();
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

  // Group by restaurant
  const batchMap = new Map<string, { meals: Map<string, number>; total: number }>();
  for (const order of orders) {
    const rName = order.dailyMenu.meal.restaurant.name;
    const mName = order.dailyMenu.meal.name;
    if (!batchMap.has(rName)) batchMap.set(rName, { meals: new Map(), total: 0 });
    const batch = batchMap.get(rName)!;
    batch.meals.set(mName, (batch.meals.get(mName) || 0) + order.quantity);
    batch.total += order.quantity;
  }

  const batches = Array.from(batchMap.entries()).map(([restaurant, data]) => ({
    restaurant,
    meals: Array.from(data.meals.entries()).map(([name, count]) => ({ name, count })),
    totalBoxes: data.total,
  }));

  const totalBoxes = batches.reduce((s, b) => s + b.totalBoxes, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <CaptainDashboard
      office={{
        id: office.id,
        name: office.name,
        code: office.code,
        slug: office.slug,
        address: office.address,
        collectionPoint: office.collectionPoint,
        assistantName: office.assistantName,
      }}
      orders={orders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        status: o.status,
        totalAmount: o.totalAmount,
        quantity: o.quantity,
        mealName: o.dailyMenu.meal.name,
        restaurantName: o.dailyMenu.meal.restaurant.name,
      }))}
      batches={batches}
      totalBoxes={totalBoxes}
      totalRevenue={totalRevenue}
    />
  );
}
