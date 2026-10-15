import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json() as { name?: string; address?: string };
  const { name, address } = body;

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json(
      { success: false, error: "Name and address required" },
      { status: 400 }
    );
  }

  // Check for exact or partial (fuzzy) name match
  const allActive = await prisma.dropPoint.findMany({
    where: { isActive: true },
  });

  const nameLower = name.trim().toLowerCase();
  const existing = allActive.find((dp) => {
    const dpLower = dp.name.toLowerCase();
    // Exact match
    if (dpLower === nameLower) return true;
    // Only fuzzy match if both names are long enough and the difference is small
    // e.g. "Sterling Towers" vs "Sterling Tower" (1 char diff) = match
    // e.g. "Sterling" vs "Sterling Towers" (7 char diff) = no match
    const longer = dpLower.length > nameLower.length ? dpLower : nameLower;
    const shorter = dpLower.length > nameLower.length ? nameLower : dpLower;
    if (longer.includes(shorter) && longer.length - shorter.length <= 3) return true;
    return false;
  });

  if (existing) {
    return NextResponse.json({ success: true, data: existing });
  }

  const dropPoint = await prisma.dropPoint.create({
    data: {
      name: name.trim(),
      address: address.trim(),
    },
  });

  return NextResponse.json({ success: true, data: dropPoint });
}
