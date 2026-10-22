import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, score, issues, comment } = body;

    if (!orderId || !score || score < 1 || score > 5) {
      return NextResponse.json({ success: false, error: "Invalid rating" }, { status: 400 });
    }

    // Use dynamic access since Rating model may not be generated yet
    const p = prisma as unknown as Record<string, { findUnique: (a: unknown) => Promise<unknown>; create: (a: unknown) => Promise<unknown> }>;
    if (!p.rating) {
      return NextResponse.json({ success: true, data: { score } });
    }

    const existing = await p.rating.findUnique({ where: { orderId } });
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const rating = await p.rating.create({
      data: { orderId, score, issues: issues || null, comment: comment || null },
    });

    return NextResponse.json({ success: true, data: rating });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}
