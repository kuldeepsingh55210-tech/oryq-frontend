/**
 * ORYQ Centralized Formatting Engine
 * Guarantees zero raw floating-point leakage across metrics, tooltips, and tables.
 */

/**
 * Formats a score value as a percentage with specified decimal precision.
 * Example: formatScore(51.0733) => "51.1%"
 */
export function formatScore(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return `0.${'0'.repeat(decimals)}%`;
  }
  const num = Number(value);
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats currency values in Indian numbering (INR with 'en-IN') or USD ('en-US') using Intl.NumberFormat.
 * Example: formatCurrency(124500, 'INR') => "₹1,24,500"
 * Example: formatCurrency(124500, 'USD') => "$124,500"
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: 'INR' | 'USD' = 'INR',
  maximumFractionDigits = 0
): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return currency === 'USD' ? '$0' : '₹0';
  }
  const num = Number(value);
  const currencyCode = currency === 'USD' ? 'USD' : 'INR';
  const locale = currency === 'USD' ? 'en-US' : 'en-IN';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits,
    }).format(num);
  } catch {
    return `${currency === 'USD' ? '$' : '₹'}${num.toFixed(maximumFractionDigits)}`;
  }
}

/**
 * Formats signed percentages for deltas and trend direction.
 * Note: Zero values (or numbers rounding to zero at the target precision) never receive a sign.
 * Example: formatPercent(0) => "0.0%"
 * Example: formatPercent(12.4) => "+12.4%"
 * Example: formatPercent(-8.1) => "-8.1%"
 */
export function formatPercent(
  value: number | null | undefined,
  includeSign = true,
  decimals = 1
): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return `0.${'0'.repeat(decimals)}%`;
  }
  const num = Number(value);
  const formatted = Math.abs(num).toFixed(decimals);

  // Rounded value equals zero -> return clean 0.0% with no sign
  if (Number(formatted) === 0) {
    return `${formatted}%`;
  }

  if (num > 0) {
    return includeSign ? `+${formatted}%` : `${formatted}%`;
  }
  return `-${formatted}%`;
}

/**
 * Formats a plain number with thousand separators.
 * Example: formatNumber(1245) => "1,245"
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '0';
  }
  const num = Number(value);
  try {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: decimals,
    }).format(num);
  } catch {
    return num.toFixed(decimals);
  }
}
