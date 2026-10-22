import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { isSlotExpired } from "@/lib/utils";
import { JoinClient } from "./join-client";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const office = await prisma.office.findUnique({
    where: { slug },
    include: {
      zone: true,
      _count: { select: { users: true, orders: true } },
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

  // Get today's menu + time slots
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

  // Find the active (non-expired) time slot for the pool timer
  const activeSlot = dailyMenus
    .map((dm) => dm.timeSlot)
    .find((ts) => !isSlotExpired(ts.cutoffTime));

  // Build menu preview — only show deals/combos first, then regular items
  const deals = dailyMenus.filter((dm) => dm.meal.tag === "DEAL");
  const regulars = dailyMenus.filter((dm) => dm.meal.tag !== "DEAL" && dm.meal.type !== "BUILD_YOUR_PLATE");
  const previewItems = [...deals, ...regulars].slice(0, 4);

  const menuPreview = previewItems.map((dm) => ({
    id: dm.id,
    name: dm.meal.name,
    price: dm.meal.price,
    originalPrice: dm.meal.originalPrice,
    imageUrl: dm.meal.imageUrl,
    restaurantName: dm.meal.restaurant.name,
    tag: dm.meal.tag,
  }));

  // Get unique restaurant count
  const restaurantCount = new Set(dailyMenus.map((dm) => dm.meal.restaurant.id)).size;

  return (
    <JoinClient
      office={{
        id: office.id,
        name: office.name,
        code: office.code,
        address: office.address,
        collectionPoint: office.collectionPoint,
        captainName: office.assistantName || null,
        memberCount: office._count.users,
        totalOrders: office._count.orders,
        todayOrders,
      }}
      menuPreview={menuPreview}
      poolTimer={activeSlot ? { cutoffTime: activeSlot.cutoffTime, label: activeSlot.label } : null}
      restaurantCount={restaurantCount}
    />
  );
}
