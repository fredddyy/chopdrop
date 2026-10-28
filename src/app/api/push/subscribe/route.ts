import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/user-auth";

/**
 * POST /api/push/subscribe
 * Body: { endpoint, keys: { p256dh, auth } }
 *
 * Stores a push subscription for the authenticated user.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ success: false, error: "Invalid subscription" }, { status: 400 });
  }

  // Upsert — same endpoint = update, new endpoint = create
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
  });

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/push/subscribe
 * Body: { endpoint }
 *
 * Removes a push subscription.
 */
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json({ success: false, error: "Missing endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ success: true });
}
