import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDeliveryFee, DEFAULT_TIERS } from "@/lib/delivery-fee";
import type { DeliveryTier } from "@/lib/delivery-fee";

// GET /api/delivery-fee?storeId=X&userLat=X&userLng=X
// OR  /api/delivery-fee?storeLat=X&storeLng=X&userLat=X&userLng=X
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const userLat = parseFloat(sp.get("userLat") || "");
  const userLng = parseFloat(sp.get("userLng") || "");

  if (isNaN(userLat) || isNaN(userLng)) {
    return NextResponse.json({ success: false, error: "userLat and userLng required" }, { status: 400 });
  }

  let storeLat = parseFloat(sp.get("storeLat") || "");
  let storeLng = parseFloat(sp.get("storeLng") || "");
  const storeId = sp.get("storeId");

  // Look up store coords from DB if storeId provided
  if (storeId && (isNaN(storeLat) || isNaN(storeLng))) {
    const store = await prisma.restaurant.findUnique({
      where: { id: storeId },
      select: { latitude: true, longitude: true },
    });
    if (!store?.latitude || !store?.longitude) {
      return NextResponse.json({ success: false, error: "Store has no coordinates set" }, { status: 400 });
    }
    storeLat = store.latitude;
    storeLng = store.longitude;
  }

  if (isNaN(storeLat) || isNaN(storeLng)) {
    return NextResponse.json({ success: false, error: "storeLat/storeLng or storeId required" }, { status: 400 });
  }

  // Load ops-managed tiers from DB
  let tiers: DeliveryTier[] = DEFAULT_TIERS;
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "delivery-fee-tiers" } });
    if (setting?.value && Array.isArray(setting.value)) {
      tiers = setting.value as unknown as DeliveryTier[];
    }
  } catch { /* use defaults */ }

  const result = calculateDeliveryFee(storeLat, storeLng, userLat, userLng, tiers);

  return NextResponse.json({
    success: true,
    data: {
      distanceKm: result.distanceKm,
      fee: result.fee,
      feeNaira: result.feeNaira,
      formatted: `₦${result.feeNaira.toLocaleString()}`,
    },
  });
}
