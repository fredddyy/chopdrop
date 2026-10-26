import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
        categoryId: z.string().min(1),
      })
    )
    .min(1)
    .max(200),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    parsed.data.items.map((item) =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, categoryId: item.categoryId },
      })
    )
  );

  return NextResponse.json({ success: true });
}
