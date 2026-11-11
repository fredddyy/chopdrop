import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/set-coords — one-time script to set GPS for all restaurants
export async function GET() {
  const updates = [
    { id: "cmw4yy1w2000008jsng6lwbix", name: "Chicken Republic", lat: 6.6018, lng: 3.3515 },
    { id: "cmvselm4t000108jwe33k8nii", name: "Chop Store", lat: 6.5955, lng: 3.3485 },
    { id: "cmvuuly64000108jmondi4hcp", name: "Brun Caffe", lat: 6.5850, lng: 3.3450 },
    { id: "cb8c21fa-0e61-4b3c-8d81-6d9f1d2fc695", name: "The Place-Ikeja GRA", lat: 6.5835, lng: 3.3465 },
    { id: "cmvtpdamo000008kzespxgagh", name: "Pie Xpress", lat: 6.5890, lng: 3.3520 },
    { id: "cmv8ccxzf0000i01bivkblrxm", name: "Ajisafe Pepper Rice", lat: 6.5960, lng: 3.3500 },
  ];

  const results = [];
  for (const u of updates) {
    try {
      await prisma.restaurant.update({
        where: { id: u.id },
        data: { latitude: u.lat, longitude: u.lng },
      });
      results.push({ name: u.name, status: "ok", lat: u.lat, lng: u.lng });
    } catch (e) {
      results.push({ name: u.name, status: "error", error: String(e) });
    }
  }

  return NextResponse.json({ success: true, results });
}
