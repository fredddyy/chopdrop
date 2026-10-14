import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMealSchema } from "@/lib/validators";

export async function GET() {
  const meals = await prisma.meal.findMany({
    include: { restaurant: true },
    orderBy: { createdAt: "desc" },
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

  const meal = await prisma.meal.create({
    data: parsed.data,
    include: { restaurant: true },
  });

  return NextResponse.json({ success: true, data: meal }, { status: 201 });
}
