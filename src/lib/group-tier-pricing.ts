/**
 * Restaurant-level group tier pricing.
 *
 * Tiers are stored on Restaurant.groupTiers as JSON:
 *   [{min: 3, discount: 10}, {min: 5, discount: 20}, {min: 10, discount: 30}]
 *
 * - `min`: minimum paid members in a group order to unlock this tier
 * - `discount`: percentage off all items (10 = 10% off)
 * - Tiers must be sorted ascending by `min`
 * - If no tier is met, no discount (full price)
 */

export interface GroupTier {
  min: number;
  discount: number; // percentage (10 = 10%)
}

/**
 * Parse and validate group tiers from the JSON field.
 * Returns sorted tiers or empty array if invalid/null.
 */
export function parseGroupTiers(raw: unknown): GroupTier[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is GroupTier =>
        typeof t === "object" &&
        t !== null &&
        typeof t.min === "number" &&
        typeof t.discount === "number" &&
        t.min > 0 &&
        t.discount > 0 &&
        t.discount < 100
    )
    .sort((a, b) => a.min - b.min);
}

/**
 * Get the effective discount% for the current paid member count.
 * Returns the highest tier whose `min` threshold is met.
 */
export function getGroupDiscount(
  tiers: GroupTier[],
  paidMemberCount: number
): { discount: number; tierIndex: number; nextTier: GroupTier | null } {
  if (tiers.length === 0) {
    return { discount: 0, tierIndex: -1, nextTier: tiers[0] || null };
  }

  let discount = 0;
  let tierIndex = -1;

  for (let i = 0; i < tiers.length; i++) {
    if (paidMemberCount >= tiers[i].min) {
      discount = tiers[i].discount;
      tierIndex = i;
    } else {
      break;
    }
  }

  const nextTier = tierIndex + 1 < tiers.length ? tiers[tierIndex + 1] : null;

  return { discount, tierIndex, nextTier };
}

/**
 * Calculate the refund amount for a member given their subtotal and discount%.
 */
export function calculateSettlement(subtotal: number, discount: number): number {
  if (discount <= 0 || subtotal <= 0) return 0;
  return Math.round(subtotal * discount / 100);
}
