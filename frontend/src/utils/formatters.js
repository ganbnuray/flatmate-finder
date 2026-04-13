/**
 * @fileoverview Shared formatting helpers.
 */

/**
 * Formats a monthly budget range with a currency symbol.
 *
 * @param {number|null|undefined} min - Minimum monthly budget.
 * @param {number|null|undefined} max - Maximum monthly budget.
 * @param {string} [currencySymbol='$'] - Currency symbol prefix.
 * @returns {string} Formatted budget range string.
 */
export function formatBudgetRange(min, max, currencySymbol = '$') {
  const safeMin = min ?? 0;
  const safeMax = max ?? 0;
  return `${currencySymbol}${safeMin.toLocaleString()} – ${currencySymbol}${safeMax.toLocaleString()}/mo`;
}
