import { prisma } from "@/lib/prisma";
import { isSlotExpired } from "@/lib/utils";
import { MenuContent } from "@/components/menu-content";
import { EmptyMenu } from "@/components/empty-menu";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  // Get all time slots
  const timeSlots = await prisma.timeSlot.findMany();

  if (timeSlots.length === 0) {
    return <EmptyMenu />;
  }

  // Get all active meals with their restaurants
  const activeMeals = await prisma.meal.findMany({
    where: { isAvailable: true, restaurant: { isActive: true } },
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
  });

  if (activeMeals.length === 0) {
    return <EmptyMenu />;
  }

  // Daily menu entries are now created ONLY via the ops dashboard or auto-publish API.
  // No more auto-creating every meal for every slot — meals belong to specific time slots
  // as published by the admin. This prevents breakfast items showing in lunch and vice versa.

  // Now fetch the daily menus normally
  const dailyMenus = await prisma.dailyMenu.findMany({
    where: {
      date: today,
      meal: { isAvailable: true, restaurant: { isActive: true } },
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

  // Group by time slot
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

  const slots = Array.from(slotMap.entries())
    .sort(([, a], [, b]) => a.startTime.localeCompare(b.startTime))
    .map(([id, slot]) => {
      const expired = isSlotExpired(slot.cutoffTime);

      // Only show restaurants that have a BUILD_YOUR_PLATE entry (full menu enabled)
      const restaurantMap = new Map<string, { id: string; name: string; imageUrl: string | null; address: string; mealCount: number; previewImage: string | null }>();
      for (const dm of slot.menus) {
        if (dm.meal.type !== "BUILD_YOUR_PLATE") continue; // skip deals/combos — they show in combo section
        const r = dm.meal.restaurant;
        const menuItemCount = r.menuCategories.reduce((sum, cat) => sum + cat.items.length, 0);
        restaurantMap.set(r.id, { id: r.id, name: r.name, imageUrl: r.imageUrl, address: r.address, mealCount: menuItemCount, previewImage: dm.meal.imageUrl });
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
          restaurantId: dm.meal.restaurant.id, restaurantName: dm.meal.restaurant.name, restaurantAddress: dm.meal.restaurant.address, restaurantImageUrl: dm.meal.restaurant.imageUrl,
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

  const defaultSlot = slots.find((s) => !s.expired)?.id || slots[0]?.id || "";

  return (
    <MenuContent
      slots={slots}
      defaultSlotId={defaultSlot}
    />
  );
}
