import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.toUpperCase().trim();
  const id = searchParams.get("id")?.trim();

  if (!code && !id) {
    return NextResponse.json(
      { success: false, error: "Office code or id is required" },
      { status: 400 }
    );
  }

  const office = id
    ? await prisma.office.findUnique({ where: { id } })
    : await prisma.office.findUnique({ where: { code: code! } });

  if (!office || !office.isActive) {
    return NextResponse.json(
      { success: false, error: "Office not found. Check your code and try again." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: office.id,
      name: office.name,
      code: office.code,
      address: office.address,
      collectionPoint: office.collectionPoint,
      assistantName: office.assistantName,
      assistantPhone: office.assistantPhone,
    },
  });
}
