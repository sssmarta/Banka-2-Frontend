/**
 * Named comparator funkcije za uobicajene sort patterne (balance / date /
 * amount desc). Ranije inline `sort((a, b) => ...)` u 6+ fajlova; sad
 * deljene + samodokumentujuce.
 */

const toTime = (value: string | null | undefined): number => {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Najnoviji prvo (po `createdAt` polju). */
export const sortByCreatedAtDesc = <T extends { createdAt?: string | null }>(a: T, b: T): number =>
  toTime(b.createdAt) - toTime(a.createdAt);

/** Najveci balance prvo. */
export const sortByAvailableBalanceDesc = <T extends { availableBalance?: number | null }>(
  a: T,
  b: T,
): number => (b.availableBalance ?? 0) - (a.availableBalance ?? 0);

/** Najveci iznos prvo. */
export const sortByAmountDesc = <T extends { amount?: number | null }>(a: T, b: T): number =>
  (b.amount ?? 0) - (a.amount ?? 0);
