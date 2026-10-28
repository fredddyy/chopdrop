import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/users/[id]/role
 * Body: { role: "USER" | "CAPTAIN" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { role } = body;

  if (!role || !["USER", "CAPTAIN"].includes(role)) {
    return NextResponse.json(
      { success: false, error: "Role must be USER or CAPTAIN" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, firstName: true, phone: true, role: true },
  });

  return NextResponse.json({ success: true, data: user });
}
