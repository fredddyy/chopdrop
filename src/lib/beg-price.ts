/**
 * Beg Price — viral credit mechanic.
 *
 * Each unique click on a member's beg link earns them wallet credit
 * with diminishing returns. Ops configures tiers via the Setting table.
 */

export interface BegPriceConfig {
  discounts: number[]; // kobo per click, diminishing (index = click number)
  floorPct: number;    // min credit as % of groupPrice (caps total credit)
  maxClicks: number;   // stop giving credit after this many
  enabled: boolean;    // global kill switch
}

export const DEFAULT_BEG_CONFIG: BegPriceConfig = {
  discounts: [10000, 8000, 6000, 5000, 4000, 3000, 2000, 1000],
  floorPct: 40,
  maxClicks: 15,
  enabled: true,
};

/**
 * How much credit does the Nth click earn (0-indexed)?
 * Returns 0 if past maxClicks.
 */
export function calculateBegCredit(
  clickIndex: number,
  config: BegPriceConfig = DEFAULT_BEG_CONFIG,
): number {
  if (!config.enabled || clickIndex >= config.maxClicks) return 0;
  if (config.discounts.length === 0) return 0;
  const idx = Math.min(clickIndex, config.discounts.length - 1);
  return config.discounts[idx];
}

/**
 * Total credit earned so far, capped by the floor.
 * Floor = groupPrice * floorPct / 100 → max credit = groupPrice - floor.
 */
export function getTotalBegCredit(
  clickCount: number,
  groupPrice: number,
  config: BegPriceConfig = DEFAULT_BEG_CONFIG,
): { totalCredit: number; maxCredit: number; atMax: boolean } {
  const maxCredit = Math.round(groupPrice * (100 - config.floorPct) / 100);
  let totalCredit = 0;
  for (let i = 0; i < clickCount; i++) {
    totalCredit += calculateBegCredit(i, config);
  }
  totalCredit = Math.min(totalCredit, maxCredit);
  return { totalCredit, maxCredit, atMax: totalCredit >= maxCredit };
}
