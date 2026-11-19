import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

// GET — list all available avatars
export async function GET() {
  const avatars = Array.from({ length: 9 }, (_, i) => `/avatars/${i + 1}.png`);
  return NextResponse.json({ success: true, data: avatars });
}

// POST — set avatar for authenticated user
export async function POST(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const { avatarUrl } = await request.json();
  if (!avatarUrl || typeof avatarUrl !== "string" || !avatarUrl.startsWith("/avatars/")) {
    return NextResponse.json({ success: false, error: "Invalid avatar" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

  return NextResponse.json({ success: true, data: { avatarUrl } });
}
