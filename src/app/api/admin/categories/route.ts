import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — create a new category
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { restaurantId, name, selectionRule, sortOrder } = body;

  if (!restaurantId || !name) {
    return NextResponse.json(
      { success: false, error: "restaurantId and name are required" },
      { status: 400 }
    );
  }

  const category = await prisma.menuCategory.create({
    data: {
      restaurantId,
      name: name.trim(),
      selectionRule: selectionRule || "PICK_ONE",
      sortOrder: sortOrder || 0,
    },
  });

  return NextResponse.json({ success: true, data: category });
}
