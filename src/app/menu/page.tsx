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

  // Group daily menus by time slot
  const slotMap = new Map<string, { label: string; startTime: string; cutoffTime: string; menus: typeof dailyMenus }>();
  for (const dm of dailyMenus) {
    const key = dm.timeSlot.id;
    const existing = slotMap.get(key);
    if (existing) {
      existing.menus.push(dm);
    } else {
      slotMap.set(key, {
        label: dm.timeSlot.label,
        startTime: dm.timeSlot.startTime,
        cutoffTime: dm.timeSlot.cutoffTime,
        menus: [dm],
      });
    }
  }

  // Sort slots by startTime (breakfast first, then lunch)
  const slots = Array.from(slotMap.entries())
    .sort(([, a], [, b]) => a.startTime.localeCompare(b.startTime))
    .map(([id, slot]) => {
      const expired = isSlotExpired(slot.cutoffTime);

      // Build restaurant list for this slot
      const restaurantMap = new Map<string, { id: string; name: string; imageUrl: string | null; address: string; mealCount: number; previewImage: string | null }>();
      for (const dm of slot.menus) {
        const r = dm.meal.restaurant;
        const existing = restaurantMap.get(r.id);
        if (existing) {
          existing.mealCount++;
          if (!existing.previewImage && dm.meal.imageUrl) existing.previewImage = dm.meal.imageUrl;
        } else {
          restaurantMap.set(r.id, { id: r.id, name: r.name, imageUrl: r.imageUrl, address: r.address, mealCount: 1, previewImage: dm.meal.imageUrl });
        }
      }

      const items = slot.menus.map((dm) => {
        let minPrice = dm.meal.price;
        if (dm.meal.type === "BUILD_YOUR_PLATE") {
          const categories = dm.meal.restaurant.menuCategories;
          minPrice = categories.reduce((total, cat) => {
            if (cat.selectionRule === "PICK_ONE" || cat.selectionRule === "PICK_ONE_OR_MORE") {
              const cheapest = Math.min(...cat.items.map((i) => i.price));
              return total + cheapest;
            }
            return total;
          }, 0);
        }
        return {
          id: dm.id, name: dm.meal.name, description: dm.meal.description, imageUrl: dm.meal.imageUrl,
          price: minPrice, originalPrice: dm.meal.originalPrice, maxDeals: dm.meal.maxDeals, claimedPad: dm.meal.claimedPad,
          tag: dm.meal.tag, type: dm.meal.type,
          restaurantId: dm.meal.restaurant.id, restaurantName: dm.meal.restaurant.name, restaurantAddress: dm.meal.restaurant.address,
          startTime: dm.timeSlot.startTime, endTime: dm.timeSlot.endTime,
          remaining: dm.maxOrders - dm.currentOrders, expired,
          categories: dm.meal.type === "BUILD_YOUR_PLATE"
            ? dm.meal.restaurant.menuCategories.map((cat) => ({
                id: cat.id, name: cat.name, selectionRule: cat.selectionRule,
                items: cat.items.map((item) => ({ id: item.id, name: item.name, price: item.price })),
              }))
            : undefined,
        };
      });

      return {
        id,
        label: slot.label,
        startTime: slot.startTime,
        cutoffTime: slot.cutoffTime,
        expired,
        restaurants: Array.from(restaurantMap.values()),
        items,
      };
    });

  // Pick default tab: first non-expired slot, or first slot
  const defaultSlot = slots.find((s) => !s.expired)?.id || slots[0]?.id || "";

  return (
    <MenuContent
      slots={slots}
      defaultSlotId={defaultSlot}
    />
  );
}
