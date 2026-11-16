import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — one-time fix: set all restaurants to 25% group delivery
export async function POST() {
  const result = await prisma.restaurant.updateMany({
    data: { groupDeliveryPct: 25 },
  });
  return NextResponse.json({ success: true, updated: result.count });
}
