import api from './api';
import type { TaxRecord, TaxBreakdownResponse } from '../types/celina3';

const taxService = {
  /**
   * GET /tax?userType=&name=
   * Lista korisnika sa dugovanjima (za supervizor portal).
   */
  getTaxRecords: async (userType?: string, name?: string): Promise<TaxRecord[]> => {
    const params: Record<string, string> = {};
    if (userType) params.userType = userType;
    if (name) params.name = name;
    const response = await api.get('/tax', { params });
    return response.data;
  },

  /**
   * POST /tax/calculate
   * Pokreni obracun poreza za tekuci mesec.
   */
  triggerCalculation: async (): Promise<void> => {
    await api.post('/tax/calculate');
  },

  /**
   * GET /tax/{userId}/details?userType=CLIENT|EMPLOYEE
   * Spec Celina 3: detaljan prikaz poreske obaveze (koje transakcije su
   * doprinele profitu/gubitku) za pojedinacnog korisnika.
   *
   * Ako BE endpoint nije implementiran, hvataju se 404/501 i baca posebna
   * exception klasa kako bi UI mogao gracefully da prikaze placeholder.
   */
  getTaxBreakdown: async (
    userId: number,
    userType: string,
    year?: number,
    month?: number,
  ): Promise<TaxBreakdownResponse> => {
    const params: Record<string, string> = { userType };
    if (year !== undefined) params.year = String(year);
    if (month !== undefined) params.month = String(month);
    const response = await api.get(`/tax/${userId}/details`, { params });
    return response.data;
  },
};

export default taxService;
