import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users — list users with search, pagination
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { phone: { contains: search } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
        wallet: { select: { balance: true } },
        _count: { select: { poolMemberships: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const data = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    walletBalance: u.wallet?.balance ?? 0,
    poolCount: u._count.poolMemberships,
    orderCount: u._count.orders,
  }));

  return NextResponse.json({
    success: true,
    data,
    meta: { total, page, limit },
  });
}
