import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { JoinClient } from "./join-client";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Find the office by slug
  const office = await prisma.office.findUnique({
    where: { slug },
    include: {
      zone: true,
      _count: { select: { users: true } },
    },
  });

  if (!office || !office.isActive) {
    return (
      <main className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center px-6">
        <Logo size={36} />
        <h1 className="font-display font-bold text-[20px] text-[#1a1a1a] mt-6 mb-2">Office not found</h1>
        <p className="text-[14px] text-[#9ca3af] text-center max-w-[280px]">
          This link may have expired or the office hasn&apos;t been set up yet.
        </p>
        <a href="/menu" className="mt-6 bg-[#f05f4b] text-white font-bold text-[14px] px-6 py-3 rounded-xl">
          Go to menu
        </a>
      </main>
    );
  }

  // Get today's menu items for this office's zone
  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  const dailyMenus = await prisma.dailyMenu.findMany({
    where: {
      date: today,
      meal: { isAvailable: true, restaurant: { isActive: true } },
    },
    include: {
      meal: { include: { restaurant: true } },
      timeSlot: true,
    },
    take: 6,
  });

  // Count today's orders from this office
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayOrders = await prisma.order.count({
    where: {
      officeId: office.id,
      createdAt: { gte: todayStart, lte: todayEnd },
      paymentStatus: "SUCCESS",
    },
  });

  const menuPreview = dailyMenus.map((dm) => ({
    id: dm.id,
    name: dm.meal.name,
    price: dm.meal.price,
    imageUrl: dm.meal.imageUrl,
    restaurantName: dm.meal.restaurant.name,
    tag: dm.meal.tag,
  }));

  return (
    <JoinClient
      office={{
        id: office.id,
        name: office.name,
        code: office.code,
        address: office.address,
        collectionPoint: office.collectionPoint,
        memberCount: office._count.users,
        todayOrders,
      }}
      menuPreview={menuPreview}
    />
  );
}
