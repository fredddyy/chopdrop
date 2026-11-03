/**
 * Distance-based delivery fee calculator.
 *
 * Uses the Haversine formula to compute straight-line distance between
 * store and user, then maps to a fee tier. Tiers are in kobo.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in kilometres between two lat/lng points. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DeliveryTier {
  maxKm: number;
  fee: number; // kobo
}

/** Default tiers used when ops hasn't configured custom ones yet. */
export const DEFAULT_TIERS: DeliveryTier[] = [
  { maxKm: 3, fee: 50000 },         // 0–3 km   → ₦500
  { maxKm: 7, fee: 100000 },        // 3–7 km   → ₦1,000
  { maxKm: 15, fee: 150000 },       // 7–15 km  → ₦1,500
  { maxKm: 25, fee: 200000 },       // 15–25 km → ₦2,000
  { maxKm: 999999, fee: 250000 },   // 25+ km   → ₦2,500
];

export interface DeliveryFeeResult {
  distanceKm: number;
  fee: number;       // kobo
  feeNaira: number;  // naira (fee / 100)
}

/**
 * Calculate delivery fee from store to user based on GPS coordinates.
 * Pass custom tiers from DB, or falls back to DEFAULT_TIERS.
 */
export function calculateDeliveryFee(
  storeLat: number,
  storeLng: number,
  userLat: number,
  userLng: number,
  tiers?: DeliveryTier[],
): DeliveryFeeResult {
  const distanceKm = haversineKm(storeLat, storeLng, userLat, userLng);
  const t = (tiers && tiers.length > 0 ? tiers : DEFAULT_TIERS).sort((a, b) => a.maxKm - b.maxKm);
  const tier = t.find((x) => distanceKm <= x.maxKm) ?? t[t.length - 1];
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    fee: tier.fee,
    feeNaira: tier.fee / 100,
  };
}
