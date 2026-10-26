import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMealSchema } from "@/lib/validators";

export async function GET() {
  const meals = await prisma.meal.findMany({
    include: { restaurant: true },
    orderBy: [{ restaurantId: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ success: true, data: meals });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createMealSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Auto-assign sortOrder to place new meal at end of restaurant's list
  if (parsed.data.sortOrder === undefined) {
    const maxSort = await prisma.meal.aggregate({
      where: { restaurantId: parsed.data.restaurantId },
      _max: { sortOrder: true },
    });
    parsed.data.sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  }

  const meal = await prisma.meal.create({
    data: parsed.data,
    include: { restaurant: true },
  });

  return NextResponse.json({ success: true, data: meal }, { status: 201 });
}
