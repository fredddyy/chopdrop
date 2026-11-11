import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDeliveryFeeAsync } from "@/lib/delivery-fee";

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
    // Vendor has no GPS — return a default estimate instead of erroring
    return NextResponse.json({
      success: true,
      data: {
        fullFee: 100000, // ₦1,000 default
        subsidizedFee: Math.round(100000 / product.minPoolSize),
        distanceKm: 0,
        walkMinutes: 0,
        estimated: true,
      },
    });
  }

  const result = await calculateDeliveryFeeAsync(storeLat, storeLng, lat, lng, prisma);
  const fullFee = result.fee;
  const subsidizedFee = Math.round(fullFee / Math.max(product.minPoolSize, 1));
  const walkMinutes = Math.round((result.distanceKm / 5) * 60);

  return NextResponse.json({
    success: true,
    data: {
      fullFee,
      subsidizedFee,
      distanceKm: result.distanceKm,
      walkMinutes,
      estimated: false,
    },
  });
}
