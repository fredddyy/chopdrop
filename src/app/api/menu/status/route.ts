import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSlotExpired } from "@/lib/utils";

export async function GET() {
  const timeSlots = await prisma.timeSlot.findMany();
  const allExpired = timeSlots.length === 0 || timeSlots.every((s) => isSlotExpired(s.cutoffTime));
  return NextResponse.json({ allExpired });
}
