import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/settings?key=delivery-fee-tiers
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ success: false, error: "key required" }, { status: 400 });

  const setting = await prisma.setting.findUnique({ where: { key } });
  return NextResponse.json({ success: true, data: setting?.value ?? null });
}

// PUT /api/admin/settings — { key, value }
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { key, value } = body;
  if (!key) return NextResponse.json({ success: false, error: "key required" }, { status: 400 });

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return NextResponse.json({ success: true, data: setting.value });
}
