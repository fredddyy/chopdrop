import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const zones = await prisma.zone.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { restaurants: true, offices: true } },
    },
  });

  return NextResponse.json({ success: true, data: zones });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ success: false, error: "Zone name is required" }, { status: 400 });
  }

  const zone = await prisma.zone.create({
    data: {
      name: body.name.trim(),
      areas: body.areas?.trim() || "",
    },
  });

  return NextResponse.json({ success: true, data: zone }, { status: 201 });
}
