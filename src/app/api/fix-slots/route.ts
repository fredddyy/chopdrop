import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  // Update all time slots to have a late cutoff so menu is always visible
  const updated = await prisma.timeSlot.updateMany({
    data: {
      cutoffTime: "23:59",
    },
  });

  const slots = await prisma.timeSlot.findMany();

  return NextResponse.json({
    success: true,
    message: `Updated ${updated.count} time slots to 23:59 cutoff`,
    slots: slots.map((s) => ({
      id: s.id,
      label: s.label,
      startTime: s.startTime,
      endTime: s.endTime,
      cutoffTime: s.cutoffTime,
    })),
  });
}
