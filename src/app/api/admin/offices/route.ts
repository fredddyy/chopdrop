import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

function generateOfficeCode(name: string): string {
  const prefix = name.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 5);
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

function generateSlug(name: string, address: string): string {
  const combined = `${name} ${address}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/-$/, "");
}

export async function GET() {
  const offices = await prisma.office.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({ success: true, data: offices });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const code = body.code?.toUpperCase().trim() || generateOfficeCode(body.name || "OFF");
  const slug = generateSlug(body.name || "office", body.address || "");

  // Check uniqueness
  const existingCode = await prisma.office.findUnique({ where: { code } });
  if (existingCode) {
    return NextResponse.json(
      { success: false, error: "Office code already exists" },
      { status: 400 }
    );
  }

  // Ensure slug uniqueness
  let finalSlug = slug;
  const existingSlug = await prisma.office.findUnique({ where: { slug } });
  if (existingSlug) {
    finalSlug = `${slug}-${Math.floor(Math.random() * 100)}`;
  }

  const secretToken = nanoid(12);

  const office = await prisma.office.create({
    data: {
      name: body.name,
      code,
      slug: finalSlug,
      secretToken,
      address: body.address,
      collectionPoint: body.collectionPoint || "Main reception",
      assistantName: body.assistantName || null,
      assistantPhone: body.assistantPhone || null,
      assistantEmail: body.assistantEmail || null,
    },
  });

  return NextResponse.json({ success: true, data: office }, { status: 201 });
}
