import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    include: {
      menuCategories: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: restaurants });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: body.name,
      address: body.address,
      phone: body.phone,
      imageUrl: body.imageUrl || null,
    },
  });

  return NextResponse.json({ success: true, data: restaurant }, { status: 201 });
}
