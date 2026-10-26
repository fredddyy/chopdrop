import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reorderMealsSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = reorderMealsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    parsed.data.items.map((item) =>
      prisma.meal.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, restaurantId: item.restaurantId },
      })
    )
  );

  return NextResponse.json({ success: true });
}
