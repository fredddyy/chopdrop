import { prisma } from "@/lib/prisma";
import { isSlotExpired } from "@/lib/utils";
import { MenuContent } from "@/components/menu-content";
import { EmptyMenu } from "@/components/empty-menu";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  // Use date string to avoid timezone issues — match the DB date format
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const today = new Date(todayStr + "T00:00:00.000Z");

  const dailyMenus = await prisma.dailyMenu.findMany({
    where: {
      date: today,
      meal: { isAvailable: true },
    },
    include: {
      meal: {
        include: {
          restaurant: {
            include: {
              menuCategories: {
                include: { items: { orderBy: { sortOrder: "asc" } } },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      timeSlot: true,
    },
  });

  if (dailyMenus.length === 0) {
    return <EmptyMenu />;
  }

  const cutoffTimes = dailyMenus.map((dm) => dm.timeSlot.cutoffTime);
  const earliestCutoff = cutoffTimes.sort()[0];
  const allExpired = cutoffTimes.every((ct) => isSlotExpired(ct));

  // Build restaurant list with meal counts and preview images
  const restaurantMap = new Map<
    string,
    {
      id: string;
      name: string;
      imageUrl: string | null;
      address: string;
      mealCount: number;
      previewImage: string | null;
    }
  >();
  for (const dm of dailyMenus) {
    const r = dm.meal.restaurant;
    const existing = restaurantMap.get(r.id);
    if (existing) {
      existing.mealCount++;
      if (!existing.previewImage && dm.meal.imageUrl) {
        existing.previewImage = dm.meal.imageUrl;
      }
    } else {
      restaurantMap.set(r.id, {
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
        address: r.address,
        mealCount: 1,
        previewImage: dm.meal.imageUrl,
      });
    }
  }
  const restaurants = Array.from(restaurantMap.values());

  const items = dailyMenus.map((dm) => {
    let minPrice = dm.meal.price;
    if (dm.meal.type === "BUILD_YOUR_PLATE") {
      const categories = dm.meal.restaurant.menuCategories;
      minPrice = categories.reduce((total, cat) => {
        if (
          cat.selectionRule === "PICK_ONE" ||
          cat.selectionRule === "PICK_ONE_OR_MORE"
        ) {
          const cheapest = Math.min(...cat.items.map((i) => i.price));
          return total + cheapest;
        }
        return total;
      }, 0);
    }

    return {
      id: dm.id,
      name: dm.meal.name,
      description: dm.meal.description,
      imageUrl: dm.meal.imageUrl,
      price: minPrice,
      tag: dm.meal.tag,
      type: dm.meal.type,
      restaurantId: dm.meal.restaurant.id,
      restaurantName: dm.meal.restaurant.name,
      restaurantAddress: dm.meal.restaurant.address,
      startTime: dm.timeSlot.startTime,
      endTime: dm.timeSlot.endTime,
      remaining: dm.maxOrders - dm.currentOrders,
      expired: isSlotExpired(dm.timeSlot.cutoffTime),
      categories:
        dm.meal.type === "BUILD_YOUR_PLATE"
          ? dm.meal.restaurant.menuCategories.map((cat) => ({
              id: cat.id,
              name: cat.name,
              selectionRule: cat.selectionRule,
              items: cat.items.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
              })),
            }))
          : undefined,
    };
  });

  return (
    <MenuContent
      items={items}
      restaurants={restaurants}
      cutoffTime={earliestCutoff}
      allExpired={allExpired}
    />
  );
}
