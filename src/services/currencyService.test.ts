import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { currencyService } from './currencyService';

vi.mock('./api');
const mockedApi = vi.mocked(api);

describe('currencyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== getExchangeRates ====================

  describe('getExchangeRates', () => {
    it('should fetch exchange rates', async () => {
      const rates = [
        { currency: 'EUR', buyRate: 116.5, sellRate: 118.0, middleRate: 117.25, date: '2026-03-15' },
        { currency: 'USD', buyRate: 106.0, sellRate: 108.0, middleRate: 107.0, date: '2026-03-15' },
      ];
      mockedApi.get.mockResolvedValue({ data: rates });

      const result = await currencyService.getExchangeRates();

      expect(mockedApi.get).toHaveBeenCalledWith('/exchange-rates');
      expect(result).toEqual(rates);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no rates', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await currencyService.getExchangeRates();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));
      await expect(currencyService.getExchangeRates()).rejects.toThrow('Server error');
    });
  });

  // ==================== convert ====================

  describe('convert', () => {
    it('should calculate exchange with correct params', async () => {
      const conversionResult = {
        convertedAmount: 11750,
        exchangeRate: 117.5,
        fromCurrency: 'EUR',
        toCurrency: 'RSD',
      };
      mockedApi.get.mockResolvedValue({ data: conversionResult });

      const result = await currencyService.convert({
        fromCurrency: 'EUR',
        toCurrency: 'RSD',
        amount: 100,
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/exchange/calculate', {
        params: {
          amount: 100,
          fromCurrency: 'EUR',
          toCurrency: 'RSD',
        },
      });
      expect(result).toEqual(conversionResult);
    });

    it('should handle Currency type values', async () => {
      mockedApi.get.mockResolvedValue({
        data: { convertedAmount: 540, exchangeRate: 1.08, fromCurrency: 'EUR', toCurrency: 'USD' },
      });

      const result = await currencyService.convert({
        fromCurrency: 'EUR' as const,
        toCurrency: 'USD' as const,
        amount: 500,
      });

      expect(result.convertedAmount).toBe(540);
      expect(result.exchangeRate).toBe(1.08);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Invalid currency'));
      await expect(
        currencyService.convert({ fromCurrency: 'INVALID', toCurrency: 'RSD', amount: 100 })
      ).rejects.toThrow('Invalid currency');
    });
  });
});
