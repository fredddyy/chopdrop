import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Auto-publish daily menus — copies all active meals to today and tomorrow
// Called by Vercel Cron or manually via GET
export async function GET() {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA");
  const tomorrowStr = new Date(now.getTime() + 86400000).toLocaleDateString("en-CA");

  const dates = [todayStr, tomorrowStr];
  const meals = await prisma.meal.findMany({ where: { isAvailable: true } });
  const timeSlots = await prisma.timeSlot.findMany();

  let created = 0;

  for (const dateStr of dates) {
    const date = new Date(dateStr + "T00:00:00.000Z");

    for (const meal of meals) {
      for (const slot of timeSlots) {
        // Check if already exists
        const existing = await prisma.dailyMenu.findFirst({
          where: { date, mealId: meal.id, timeSlotId: slot.id },
        });

        if (!existing) {
          const maxOrders = meal.tag === "DEAL" ? (meal.maxDeals || 20) : 50;
          await prisma.dailyMenu.create({
            data: {
              date,
              mealId: meal.id,
              timeSlotId: slot.id,
              maxOrders,
            },
          });
          created++;
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Auto-published ${created} daily menu entries for ${todayStr} and ${tomorrowStr}`,
    dates,
    meals: meals.length,
    timeSlots: timeSlots.length,
  });
}
