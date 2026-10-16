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

  // Get all active meals for this restaurant — skip daily menu complexity
  const allMeals = await prisma.meal.findMany({
    where: { isAvailable: true, restaurantId: id },
    include: { restaurant: true },
  });

  // Get a time slot for reference (pick the first non-expired one)
  const timeSlots = await prisma.timeSlot.findMany();
  const cutoffTimes = timeSlots.map((ts) => ts.cutoffTime);
  const earliestCutoff = cutoffTimes.length > 0 ? cutoffTimes.sort()[0] : "23:59";
  const allExpired = cutoffTimes.length > 0 && cutoffTimes.every((ct) => isSlotExpired(ct));

  // Find a valid dailyMenuId for each meal (needed for ordering)
  const dailyMenus = await prisma.dailyMenu.findMany({
    where: { date: today, meal: { restaurantId: id, isAvailable: true } },
    include: { timeSlot: true },
  });

  // Map meal ID to first daily menu ID
  const mealToDailyMenu = new Map<string, { id: string; cutoffTime: string; maxOrders: number; currentOrders: number }>();
  for (const dm of dailyMenus) {
    if (!mealToDailyMenu.has(dm.mealId)) {
      mealToDailyMenu.set(dm.mealId, { id: dm.id, cutoffTime: dm.timeSlot.cutoffTime, maxOrders: dm.maxOrders, currentOrders: dm.currentOrders });
    }
  }

  // Combo meals (FIXED type) — one per meal, no duplicates
  const combos = allMeals
    .filter((m) => m.type === "FIXED")
    .map((m) => {
      const dm = mealToDailyMenu.get(m.id);
      return {
        dailyMenuId: dm?.id || m.id,
        name: m.name,
        description: m.description,
        imageUrl: m.imageUrl,
        price: m.price,
        tag: m.tag,
        remaining: dm ? dm.maxOrders - dm.currentOrders : 50,
        expired: dm ? isSlotExpired(dm.cutoffTime) : false,
      };
    });

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
  // Find build-your-plate meal's daily menu ID
  const buildPlateMeal = allMeals.find((m) => m.type === "BUILD_YOUR_PLATE");
  const buildPlateMenuId = buildPlateMeal ? mealToDailyMenu.get(buildPlateMeal.id)?.id || null : null;

  return (
    <RestaurantMenu
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        imageUrl: restaurant.imageUrl,
      }}
      combos={combos}
      categories={categories}
      buildPlateDailyMenuId={buildPlateMenuId}
      cutoffTime={earliestCutoff}
      allExpired={allExpired}
    />
  );
}
