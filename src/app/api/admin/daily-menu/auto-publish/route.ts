import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Auto-publish: copies yesterday's menu to today
// Call this from ops dashboard or via a cron job
export async function POST() {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(todayStr + "T00:00:00.000Z");

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if today already has menu items
  const existingToday = await prisma.dailyMenu.findMany({ where: { date: today } });
  if (existingToday.length > 0) {
    return NextResponse.json({ success: true, message: "Today's menu already published", count: existingToday.length });
  }

  // Get yesterday's menu
  const yesterdayMenu = await prisma.dailyMenu.findMany({
    where: { date: yesterday },
    include: { meal: true },
  });

  if (yesterdayMenu.length === 0) {
    return NextResponse.json({ success: false, error: "No menu from yesterday to copy" }, { status: 404 });
  }

  // Copy each entry to today with reset currentOrders
  let created = 0;
  for (const entry of yesterdayMenu) {
    if (!entry.meal.isAvailable) continue;
    try {
      await prisma.dailyMenu.create({
        data: {
          date: today,
          mealId: entry.mealId,
          timeSlotId: entry.timeSlotId,
          maxOrders: entry.maxOrders,
          currentOrders: 0,
        },
      });
      created++;
    } catch {
      // Skip duplicates
    }
  }

  return NextResponse.json({ success: true, message: `Published ${created} meals for today`, count: created });
}
