import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import portfolioService from './portfolioService';

vi.mock('./api');
const mockedApi = vi.mocked(api);

describe('portfolioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== getMyPortfolio ====================

  describe('getMyPortfolio', () => {
    it('should fetch portfolio items', async () => {
      const items = [
        {
          id: 1,
          listingTicker: 'AAPL',
          listingName: 'Apple Inc',
          listingType: 'STOCK',
          quantity: 10,
          averageBuyPrice: 150,
          currentPrice: 175,
          profit: 250,
          profitPercent: 16.67,
          publicQuantity: 0,
          lastModified: '2026-03-15',
        },
        {
          id: 2,
          listingTicker: 'MSFT',
          listingName: 'Microsoft Corp',
          listingType: 'STOCK',
          quantity: 5,
          averageBuyPrice: 400,
          currentPrice: 420,
          profit: 100,
          profitPercent: 5.0,
          publicQuantity: 2,
          lastModified: '2026-03-14',
        },
      ];
      mockedApi.get.mockResolvedValue({ data: items });

      const result = await portfolioService.getMyPortfolio();

      expect(mockedApi.get).toHaveBeenCalledWith('/portfolio/my');
      expect(result).toEqual(items);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when portfolio is empty', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await portfolioService.getMyPortfolio();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Unauthorized'));
      await expect(portfolioService.getMyPortfolio()).rejects.toThrow('Unauthorized');
    });
  });

  // ==================== getSummary ====================

  describe('getSummary', () => {
    it('should fetch portfolio summary', async () => {
      const summary = {
        totalValue: 500000,
        totalProfit: 25000,
        paidTaxThisYear: 3750,
        unpaidTaxThisMonth: 1250,
      };
      mockedApi.get.mockResolvedValue({ data: summary });

      const result = await portfolioService.getSummary();

      expect(mockedApi.get).toHaveBeenCalledWith('/portfolio/summary');
      expect(result).toEqual(summary);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));
      await expect(portfolioService.getSummary()).rejects.toThrow('Server error');
    });
  });

  // ==================== setPublicQuantity ====================

  describe('setPublicQuantity', () => {
    it('should set public quantity for a portfolio item', async () => {
      const updated = {
        id: 1,
        listingTicker: 'AAPL',
        quantity: 10,
        publicQuantity: 5,
      };
      mockedApi.patch.mockResolvedValue({ data: updated });

      const result = await portfolioService.setPublicQuantity(1, 5);

      expect(mockedApi.patch).toHaveBeenCalledWith('/portfolio/1/public', { quantity: 5 });
      expect(result).toEqual(updated);
    });

    it('should set quantity to 0', async () => {
      mockedApi.patch.mockResolvedValue({ data: { id: 1, publicQuantity: 0 } });

      const result = await portfolioService.setPublicQuantity(1, 0);

      expect(mockedApi.patch).toHaveBeenCalledWith('/portfolio/1/public', { quantity: 0 });
      expect(result.publicQuantity).toBe(0);
    });

    it('should propagate errors', async () => {
      mockedApi.patch.mockRejectedValue(new Error('Invalid quantity'));
      await expect(portfolioService.setPublicQuantity(1, -1)).rejects.toThrow('Invalid quantity');
    });
  });
});
