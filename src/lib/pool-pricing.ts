/**
 * Pool pricing — prices drop as more people from the same office order in the same time slot.
 *
 * Tiers are stored on Meal.poolTiers as JSON: [{min: 5, price: 145000}, {min: 10, price: 130000}]
 * - `min`: minimum paid orders from the office to unlock this tier
 * - `price`: the meal price in kobo at this tier
 * - Tiers must be sorted ascending by `min`
 * - If no tier is met, the meal's base `price` field is used
 */

export interface PoolTier {
  min: number;
  price: number;
}

/**
 * Parse and validate pool tiers from the JSON field.
 * Returns sorted tiers or empty array if invalid/null.
 */
export function parsePoolTiers(raw: unknown): PoolTier[] {
  if (!raw || !Array.isArray(raw)) return [];
  const tiers = raw
    .filter(
      (t): t is PoolTier =>
        typeof t === "object" &&
        t !== null &&
        typeof t.min === "number" &&
        typeof t.price === "number" &&
        t.min > 0 &&
        t.price > 0
    )
    .sort((a, b) => a.min - b.min);
  return tiers;
}

/**
 * Get the effective pool price given the current office order count.
 * Returns the highest tier whose `min` threshold is met.
 * Falls back to basePrice if no tier is met.
 */
export function getPoolPrice(
  basePrice: number,
  poolTiers: PoolTier[],
  officeOrderCount: number
): { price: number; tierIndex: number; nextTier: PoolTier | null; savings: number } {
  if (poolTiers.length === 0) {
    return { price: basePrice, tierIndex: -1, nextTier: null, savings: 0 };
  }

  let effectivePrice = basePrice;
  let tierIndex = -1;

  for (let i = 0; i < poolTiers.length; i++) {
    if (officeOrderCount >= poolTiers[i].min) {
      effectivePrice = poolTiers[i].price;
      tierIndex = i;
    } else {
      break;
    }
  }

  // Next tier is the one after the current
  const nextTier =
    tierIndex + 1 < poolTiers.length ? poolTiers[tierIndex + 1] : null;

  const savings = basePrice - effectivePrice;

  return { price: effectivePrice, tierIndex, nextTier, savings };
}
