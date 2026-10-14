import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validators";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password" },
      { status: 400 }
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { email: parsed.data.email },
  });

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const valid = await comparePassword(parsed.data.password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = signToken({ id: admin.id, email: admin.email });

  const response = NextResponse.json({
    success: true,
    data: { name: admin.name, email: admin.email },
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
