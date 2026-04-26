import api from './api';
import type { ActuaryProfit, ClientFundPosition } from '@/types/celina4';

/**
 * P6 — Spec Celina 4 (Nova) §4393-4645: Portal "Profit Banke" za supervizore.
 *
 * Dva endpointa:
 *   GET /profit-bank/actuary-performance  — spisak aktuara + profit u RSD
 *   GET /profit-bank/fund-positions       — fondovi u kojima banka ima udele
 *                                           (ClientFundPosition sa userId = ownerClientId banke)
 */
const profitBankService = {
  async listActuaryPerformance(): Promise<ActuaryProfit[]> {
    const { data } = await api.get<ActuaryProfit[]>('/profit-bank/actuary-performance');
    return data;
  },

  async listBankFundPositions(): Promise<ClientFundPosition[]> {
    const { data } = await api.get<ClientFundPosition[]>('/profit-bank/fund-positions');
    return data;
  },
};

export default profitBankService;
