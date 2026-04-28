import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import profitBankService from './profitBankService';

vi.mock('./api');
const mockedApi = vi.mocked(api);

describe('profitBankService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listActuaryPerformance', () => {
    it('GET /profit-bank/actuary-performance', async () => {
      const data = [
        { employeeId: 1, name: 'Marko Petrovic', position: 'SUPERVISOR', totalProfitRsd: 12000, ordersDone: 8 },
      ];
      mockedApi.get.mockResolvedValue({ data });

      const result = await profitBankService.listActuaryPerformance();

      expect(mockedApi.get).toHaveBeenCalledWith('/profit-bank/actuary-performance');
      expect(result).toEqual(data);
    });

    it('propagates errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server down'));
      await expect(profitBankService.listActuaryPerformance()).rejects.toThrow('Server down');
    });
  });

  describe('listBankFundPositions', () => {
    it('GET /profit-bank/fund-positions', async () => {
      const data = [
        { id: 1, fundId: 5, fundName: 'Alpha', totalInvested: 50000, currentValue: 65000, percentOfFund: 12.5 },
      ];
      mockedApi.get.mockResolvedValue({ data });

      const result = await profitBankService.listBankFundPositions();

      expect(mockedApi.get).toHaveBeenCalledWith('/profit-bank/fund-positions');
      expect(result).toEqual(data);
    });

    it('returns empty array', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      const result = await profitBankService.listBankFundPositions();
      expect(result).toEqual([]);
    });

    it('propagates errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Forbidden'));
      await expect(profitBankService.listBankFundPositions()).rejects.toThrow('Forbidden');
    });
  });
});
