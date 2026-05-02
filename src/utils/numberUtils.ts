/**
 * `Number(value) || 0` pattern se ponavlja u 20+ pages — ovde je objedinjen
 * sa explicit fallback parametrom.
 */
export function parseNumber(value: unknown, fallback: number = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Klampuje vrednost u opseg [min, max]. Tipicna upotreba: progress
 * bar percent (0-100) koji prima nesigurne BE vrednosti.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Vraca procent (0-100) kao `(part / total) * 100`, klampovan u [0, 100].
 * Pri `total <= 0` ili NaN, vraca 0. Tipicna upotreba: progress bar-ovi.
 */
export function percentOf(part: number | null | undefined, total: number | null | undefined): number {
  const p = parseNumber(part);
  const t = parseNumber(total);
  if (t <= 0) return 0;
  return clamp((p / t) * 100, 0, 100);
}
