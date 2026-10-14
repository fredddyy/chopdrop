import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { isSlotExpired } from "@/lib/utils";
import { RestaurantMenu } from "@/components/restaurant-menu";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RestaurantPage({ params }: PageProps) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      menuCategories: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!restaurant) notFound();

  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  const dailyMenus = await prisma.dailyMenu.findMany({
    where: {
      date: today,
      meal: { isAvailable: true, restaurantId: id },
    },
    include: { meal: true, timeSlot: true },
  });

  const cutoffTimes = dailyMenus.map((dm) => dm.timeSlot.cutoffTime);
  const earliestCutoff = cutoffTimes.length > 0 ? cutoffTimes.sort()[0] : "23:59";
  const allExpired = cutoffTimes.length > 0 && cutoffTimes.every((ct) => isSlotExpired(ct));

  // Combo meals (FIXED type)
  const combos = dailyMenus
    .filter((dm) => dm.meal.type === "FIXED")
    .map((dm) => ({
      dailyMenuId: dm.id,
      name: dm.meal.name,
      description: dm.meal.description,
      imageUrl: dm.meal.imageUrl,
      price: dm.meal.price,
      tag: dm.meal.tag,
      remaining: dm.maxOrders - dm.currentOrders,
      expired: isSlotExpired(dm.timeSlot.cutoffTime),
    }));

  // Individual items from menu categories
  const categories = restaurant.menuCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    items: cat.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
    })),
  }));

  // Get the build-your-plate daily menu ID (needed for adding items to cart with a valid dailyMenuId)
  const buildPlateMenu = dailyMenus.find((dm) => dm.meal.type === "BUILD_YOUR_PLATE");

  return (
    <RestaurantMenu
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
      }}
      combos={combos}
      categories={categories}
      buildPlateDailyMenuId={buildPlateMenu?.id || null}
      cutoffTime={earliestCutoff}
      allExpired={allExpired}
    />
  );
}
