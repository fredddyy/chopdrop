import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDeliveryFee, DEFAULT_TIERS } from "@/lib/delivery-fee";
import type { DeliveryTier } from "@/lib/delivery-fee";

// GET /api/delivery-estimate?productId=X&lat=Y&lng=Z
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");

  if (!productId || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { success: false, error: "Missing productId, lat, or lng" },
      { status: 400 },
    );
  }

  // Look up product -> vendor -> get vendor coordinates
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      minPoolSize: true,
      vendor: { select: { latitude: true, longitude: true } },
    },
  });

  if (!product) {
    return NextResponse.json(
      { success: false, error: "Product not found" },
      { status: 404 },
    );
  }

  const storeLat = product.vendor.latitude;
  const storeLng = product.vendor.longitude;

  if (!storeLat || !storeLng) {
    return NextResponse.json(
      { success: false, error: "Vendor location not available" },
      { status: 400 },
    );
  }

  // Load custom tiers if available
  let tiers: DeliveryTier[] = DEFAULT_TIERS;
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "delivery-fee-tiers" } });
    if (setting?.value && Array.isArray(setting.value)) {
      tiers = setting.value as unknown as DeliveryTier[];
    }
  } catch { /* use defaults */ }

  const result = calculateDeliveryFee(storeLat, storeLng, lat, lng, tiers);
  const fullFee = result.fee;
  const subsidizedFee = Math.round(fullFee / product.minPoolSize);

  // Estimate walk time: ~5 km/h average walking speed
  const walkMinutes = Math.round((result.distanceKm / 5) * 60);

  return NextResponse.json({
    success: true,
    data: {
      fullFee,
      subsidizedFee,
      distanceKm: result.distanceKm,
      walkMinutes,
    },
  });
}
