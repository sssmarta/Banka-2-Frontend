import { describe, it, expect } from 'vitest';
import { asArray, formatAmount, formatDate } from './formatters';

describe('asArray', () => {
  it('returns the same array when given an array', () => {
    const input = [1, 2, 3];
    expect(asArray(input)).toBe(input);
  });

  it('returns empty array for null', () => {
    expect(asArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(asArray(undefined)).toEqual([]);
  });

  it('returns empty array for a string', () => {
    expect(asArray('hello')).toEqual([]);
  });

  it('returns empty array for a number', () => {
    expect(asArray(42)).toEqual([]);
  });

  it('returns empty array for an object', () => {
    expect(asArray({ key: 'value' })).toEqual([]);
  });

  it('returns empty array for boolean', () => {
    expect(asArray(true)).toEqual([]);
    expect(asArray(false)).toEqual([]);
  });

  it('preserves typed array contents', () => {
    const input = [{ id: 1 }, { id: 2 }];
    const result = asArray<{ id: number }>(input);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('returns empty array for empty input (0)', () => {
    expect(asArray(0)).toEqual([]);
  });
});

describe('formatAmount', () => {
  it('formats a positive number with default decimals', () => {
    const result = formatAmount(1234.56);
    // sr-RS uses dot as thousands separator and comma as decimal
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
  });

  it('formats zero', () => {
    const result = formatAmount(0);
    expect(result).toMatch(/0[,.]00/);
  });

  it('formats negative numbers', () => {
    const result = formatAmount(-500.5);
    expect(result).toContain('500');
    expect(result).toContain('50');
  });

  it('formats with custom decimal places', () => {
    const result = formatAmount(100, 0);
    expect(result).toContain('100');
  });

  it('formats with 4 decimal places', () => {
    const result = formatAmount(1.23456, 4);
    expect(result).toContain('2346'); // rounded
  });

  it('formats null as zero using sr-RS locale', () => {
    // Number(null) === 0, which is finite, so it goes through toLocaleString
    const result = formatAmount(null);
    expect(result).toMatch(/0[,.]00/);
  });

  it('returns fallback for undefined (NaN path)', () => {
    // Number(undefined) is NaN, which is not finite → falls through to toFixed
    const result = formatAmount(undefined);
    expect(result).toBe('0.00');
  });

  it('returns fallback with custom decimals for undefined', () => {
    const result = formatAmount(undefined, 3);
    expect(result).toBe('0.000');
  });

  it('formats large numbers', () => {
    const result = formatAmount(1000000);
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('formats very small numbers', () => {
    const result = formatAmount(0.01);
    expect(result).toContain('01');
  });

  it('handles Infinity by returning fallback', () => {
    const result = formatAmount(Infinity);
    expect(result).toBe('0.00');
  });

  it('handles -Infinity by returning fallback', () => {
    const result = formatAmount(-Infinity);
    expect(result).toBe('0.00');
  });

  it('handles NaN as a number input by returning fallback', () => {
    const result = formatAmount(NaN);
    expect(result).toBe('0.00');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate('2025-01-15');
    // sr-RS format: dd.mm.yyyy. or similar
    expect(result).not.toBe('-');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('formats a full ISO datetime string', () => {
    const result = formatDate('2025-06-20T14:30:00Z');
    expect(result).not.toBe('-');
    expect(result).toContain('2025');
  });

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('-');
  });

  it('returns dash for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('-');
  });

  it('returns dash for garbage input', () => {
    expect(formatDate('abc123')).toBe('-');
  });

  it('formats date at year boundary', () => {
    const result = formatDate('2025-12-31');
    expect(result).not.toBe('-');
    expect(result).toContain('31');
  });

  it('formats date at start of year', () => {
    const result = formatDate('2025-01-01');
    expect(result).not.toBe('-');
  });
});
