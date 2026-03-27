import api from './api';
import type { PortfolioItem, PortfolioSummary } from '../types/celina3';

const portfolioService = {
  /**
   * GET /portfolio/my
   * Lista hartija u vlasnistvu korisnika sa trenutnim cenama i profitom.
   */
  getMyPortfolio: async (): Promise<PortfolioItem[]> => {
    const response = await api.get('/portfolio/my');
    return response.data;
  },

  /**
   * GET /portfolio/summary
   * Ukupna vrednost portfolija, profit, porez.
   */
  getSummary: async (): Promise<PortfolioSummary> => {
    const response = await api.get('/portfolio/summary');
    return response.data;
  },

  /**
   * PATCH /portfolio/{id}/public
   * Postavi broj akcija u javnom rezimu (za OTC trading).
   */
  setPublicQuantity: async (id: number, quantity: number): Promise<PortfolioItem> => {
    const response = await api.patch(`/portfolio/${id}/public`, { quantity });
    return response.data;
  },
};

export default portfolioService;
