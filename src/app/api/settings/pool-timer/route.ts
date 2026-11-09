import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/settings/pool-timer — public endpoint for pool timer duration
export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: "pool-default-timer" } });
  const hours = setting?.value && Number(setting.value) > 0 ? Number(setting.value) : 2;
  return NextResponse.json({ success: true, data: { hours } });
}
