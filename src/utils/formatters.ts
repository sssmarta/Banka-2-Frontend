/**
 * Shared formatting and type-guard utilities used across multiple pages.
 */

/** Safely coerce an unknown value to a typed array. */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Format a numeric amount for display using sr-RS locale. */
export function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num)
    ? num.toLocaleString('sr-RS', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : (0).toFixed(decimals);
}

/** Format a date string for display using sr-RS locale. Returns '-' for invalid/empty values. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('sr-RS');
}
