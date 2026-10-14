import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const slots = await prisma.timeSlot.findMany({
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ success: true, data: slots });
}
