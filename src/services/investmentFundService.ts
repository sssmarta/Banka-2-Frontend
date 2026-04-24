// @ts-expect-error — `api` ce se koristiti kad tim implementira TODO metode.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import api from './api';
import type {
  InvestmentFundSummary,
  InvestmentFundDetail,
  FundPerformancePoint,
  CreateFundRequest,
  InvestFundRequest,
  WithdrawFundRequest,
  ClientFundPosition,
  ClientFundTransaction,
} from '@/types/celina4';

/*
================================================================================
 TODO — SERVICE WRAPPER ZA /funds/** ENDPOINTE
 Zaduzen: jkrunic
 Spec referenca: Celina 4, Investicioni fondovi
--------------------------------------------------------------------------------
 Implementira FE API za sve endpointe iz backend InvestmentFundController.

 Preporuka za tim:
  - Pred kraj rada, pokreni `investmentFundService.test.ts` koji testira
    da svaki endpoint poziva ispravnu URL-u i handluje 4xx/5xx.
  - Kao referenca: postojeci `orderService.ts` i `otcService.ts` u istoj
    folderi.

 Svaki parametar je prefixovan `_` da TypeScript ne baca TS6133 (unused)
 dok je metoda u stub-u. Kad implementiras, skini `_` prefix.
================================================================================
*/
const investmentFundService = {
  /**
   * TODO — GET /funds?search=X&sort=Y&direction=Z
   * Koristi se na Discovery stranici.
   */
  async list(_params?: { search?: string; sort?: string; direction?: string }): Promise<InvestmentFundSummary[]> {
    throw new Error('TODO: implementirati investmentFundService.list');
  },

  /**
   * TODO — GET /funds/{id}
   * Koristi Detaljan prikaz fonda (sve info + holdings + performance).
   */
  async get(_id: number): Promise<InvestmentFundDetail> {
    throw new Error('TODO');
  },

  /**
   * TODO — GET /funds/{id}/performance?from=...&to=...
   * Tacke za grafik, u formatu FundPerformancePoint[].
   */
  async getPerformance(_id: number, _from?: string, _to?: string): Promise<FundPerformancePoint[]> {
    throw new Error('TODO');
  },

  /**
   * TODO — GET /funds/{id}/transactions
   * Istorija uplata/povlacenja za detaljan prikaz (supervizor svi, klijent samo svoje).
   */
  async getTransactions(_id: number): Promise<ClientFundTransaction[]> {
    throw new Error('TODO');
  },

  /**
   * TODO — POST /funds — samo supervizor.
   * Backend ce validirati role; FE treba da sakriva dugme ne-supervizorima.
   */
  async create(_dto: CreateFundRequest): Promise<InvestmentFundDetail> {
    throw new Error('TODO');
  },

  /**
   * TODO — POST /funds/{id}/invest
   * Klijent: uplacuje iz svog racuna sa FX komisijom (ako racun ne-RSD).
   * Supervizor: uplacuje iz bankinog racuna bez komisije.
   */
  async invest(_id: number, _dto: InvestFundRequest): Promise<ClientFundPosition> {
    throw new Error('TODO');
  },

  /**
   * TODO — POST /funds/{id}/withdraw
   * Ako dto.amount undefined → pune povlacenje. Ako nema likvidnosti u fondu,
   * backend vraca status=PENDING i klijent treba da dobije toast "u obradi".
   */
  async withdraw(_id: number, _dto: WithdrawFundRequest): Promise<ClientFundTransaction> {
    throw new Error('TODO');
  },

  /**
   * TODO — GET /funds/my-positions
   * Sve moje aktivne pozicije u svim fondovima.
   */
  async myPositions(): Promise<ClientFundPosition[]> {
    throw new Error('TODO');
  },

  /**
   * TODO — GET /funds/bank-positions (supervizor only)
   * Sve pozicije koje su vlasnistvo banke (za Profit Banke portal).
   */
  async bankPositions(): Promise<ClientFundPosition[]> {
    throw new Error('TODO');
  },
};

export default investmentFundService;
