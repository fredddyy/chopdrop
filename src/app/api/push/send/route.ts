import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails("mailto:hello@chopdrop.ng", VAPID_PUBLIC, VAPID_PRIVATE);
}

/**
 * POST /api/push/send
 * Body: { title, body, url?, officeId?, tag? }
 *
 * Sends push notification to all subscribed users (or filtered by office).
 */
export async function POST(request: NextRequest) {
  const reqBody = await request.json();
  const { title, body, url, officeId, tag } = reqBody;

  if (!title || !body) {
    return NextResponse.json({ success: false, error: "Title and body required" }, { status: 400 });
  }

  // Get target subscriptions
  const where: Record<string, unknown> = {};
  if (officeId) {
    where.user = { officeId };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where,
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  const payload = JSON.stringify({ title, body, url: url || "/menu", tag: tag || "chopdrop" });

  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired — mark for cleanup
          staleIds.push(sub.id);
        }
        failed++;
      }
    })
  );

  // Clean up expired subscriptions
  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } });
  }

  return NextResponse.json({
    success: true,
    data: { sent, failed, cleaned: staleIds.length, total: subscriptions.length },
  });
}
