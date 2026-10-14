import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDailyMenuSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const menus = await prisma.dailyMenu.findMany({
    where: { date: new Date(date) },
    include: {
      meal: { include: { restaurant: true } },
      timeSlot: true,
    },
  });

  return NextResponse.json({ success: true, data: menus });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createDailyMenuSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const menu = await prisma.dailyMenu.create({
    data: {
      date: new Date(parsed.data.date),
      mealId: parsed.data.mealId,
      timeSlotId: parsed.data.timeSlotId,
      maxOrders: parsed.data.maxOrders,
    },
    include: {
      meal: { include: { restaurant: true } },
      timeSlot: true,
    },
  });

  return NextResponse.json({ success: true, data: menu }, { status: 201 });
}
