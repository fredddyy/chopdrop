import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

export async function POST() {
  const payload = await getUserFromCookie();
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: payload.id },
    data: { officeId: null },
  });

  return NextResponse.json({ success: true });
}
