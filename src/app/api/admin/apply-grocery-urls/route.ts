import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const items = body.items as Array<{ name: string; url: string }>;
  if (!items?.length) return NextResponse.json({ success: false, error: "No items" }, { status: 400 });

  let updated = 0;
  for (const { name, url } of items) {
    const result = await prisma.product.updateMany({
      where: { name, imageUrl: null },
      data: { imageUrl: url },
    });
    updated += result.count;
  }

  return NextResponse.json({ success: true, data: { updated, total: items.length } });
}
